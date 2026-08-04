/**
 * ============================================================================
 * MODULE PURPOSE: Sales Mission Domain State Machine & Orchestrator
 * RESPONSIBILITIES:
 *  - Controls Sales Mission lifecycle: Inquiry_Received ➔ Gathering_Details ➔ Margin_Estimated ➔ Quotation_Approved ➔ Quotation_Sent ➔ Order_Confirmed.
 *  - Performs Margin Estimation calculations (Revenue, Estimated Cost, Estimated Margin, Confidence, Reason).
 *  - Manages AI natural conversation flow to collect missing order details.
 *  - Handles Quotation Approval and dispatches official quotes via `CommunicationService.sendWhatsAppMessage()`.
 *  - Creates `SalesOrder` records upon customer confirmation.
 *  - Publishes `SalesOrderConfirmed` event to `BusinessEventBus`.
 * OWNS: Sales Mission workflow state machine and event publishing for sales orders.
 * SHOULD NOT OWN: Low-level database queries or socket transport logic.
 * ============================================================================
 */

import { SalesMissionRepository, SalesMissionEntity } from '../repositories/SalesMissionRepository';
import { CustomerRepository, CustomerMasterItem } from '../repositories/CustomerRepository';
import { SalesOrderRepository } from '../repositories/SalesOrderRepository';
import { CommunicationService } from '@/lib/services/CommunicationService';
import { BusinessEventBus } from '@/lib/events/BusinessEventBus';

export class SalesMissionService {
  /**
   * Initializes a new Sales Mission for a customer inquiry.
   */
  static async createMission(
    customerName: string,
    contactChannel: string,
    whatsappJid: string,
    productName: string = 'CNC Mounting Bracket',
    quantity: number = 500
  ): Promise<SalesMissionEntity> {
    // 1. Close any previous active sales missions for this customer to ensure clean state
    const existing = await SalesMissionRepository.getAllMissions();
    for (const m of existing) {
      if (m.whatsappJid === whatsappJid || m.contactChannel === contactChannel) {
        if (m.status === 'Active') {
          m.status = 'Completed';
          m.currentStage = 'Mission_Completed';
          await SalesMissionRepository.saveMission(m);
        }
      }
    }

    const randomId = `SALES-${Math.floor(Math.random() * 9000 + 1000)}`;
    const nowStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Unit economics benchmark for CNC Mounting Bracket
    const unitPrice = 450;
    const unitCost = 280;
    const estimatedValue = quantity * unitPrice;
    const estimatedCost = quantity * unitCost;
    const estimatedMargin = estimatedValue - estimatedCost;

    const newMission: SalesMissionEntity = {
      id: randomId,
      customerName,
      contactChannel,
      whatsappJid,
      productName,
      quantity,
      deliveryDate: 'Within 7 Days',
      location: 'Peenya Industrial Area, Bangalore',
      specialRequirements: 'Anodized finish with standard wooden crate packaging',
      estimatedValue,
      estimatedCost,
      estimatedMargin,
      marginConfidence: 'High (96%)',
      businessReason: 'Standard MSME margin benchmark for precision CNC machining',
      currentStage: 'Inquiry_Received',
      status: 'Active',
      context: {
        productName,
        quantity,
        unitPrice,
        unitCost,
        deliveryDate: 'Within 7 Days',
        location: 'Peenya Industrial Area, Bangalore',
        specialRequirements: 'Anodized finish with standard wooden crate packaging'
      },
      milestones: [
        {
          timestamp: nowStr,
          stage: 'Inquiry_Received',
          text: `Inquiry received from ${customerName} for ${quantity} units of ${productName}.`,
          actor: 'Customer'
        }
      ]
    };

    const saved = await SalesMissionRepository.saveMission(newMission);
    console.log(`🚀 [SalesMissionService] Created Sales Mission '${saved.id}' for ${customerName} (${productName}).`);

    // Emit Business Event to Event Bus
    BusinessEventBus.publish({
      id: `evt-sales-${saved.id}`,
      type: 'SalesInquiryReceivedEvent',
      timestamp: nowStr,
      source: 'Sales Gateway',
      summary: `Sales Mission '${saved.id}' initialized for ${customerName} (${quantity} units of ${productName})`,
      details: { missionId: saved.id, customerName, productName, quantity, estimatedValue },
      deepLink: '/sales-agent'
    });

    return saved;
  }

  /**
   * Processes incoming customer WhatsApp messages for Sales Missions.
   */
  static async processIncomingCustomerWhatsAppEvent(
    fromPhone: string,
    messageText: string,
    customer: CustomerMasterItem
  ): Promise<{ handled: boolean; reply?: string }> {
    const allMissions = await SalesMissionRepository.getAllMissions();
    let activeMission = allMissions.find(m => 
      m.status === 'Active' && 
      (m.whatsappJid === customer.whatsappJid || m.contactChannel === customer.contactChannel || m.customerName.toLowerCase() === customer.name.toLowerCase())
    );

    // Auto-create active mission if none exists
    if (!activeMission) {
      activeMission = await this.createMission(
        customer.name,
        customer.contactChannel,
        customer.whatsappJid || fromPhone,
        customer.interestedProduct || 'CNC Mounting Bracket',
        500
      );
    }

    const nowStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const textLower = messageText.toLowerCase();

    // STAGE 1: ORDER CONFIRMATION CHECK
    if (
      activeMission.currentStage === 'Quotation_Sent' || 
      activeMission.currentStage === 'Quotation_Approved' ||
      textLower.includes('confirm') || 
      textLower.includes('accept') || 
      textLower.includes('proceed') || 
      textLower.includes('yes') || 
      textLower.includes('approved')
    ) {
      if (textLower.includes('confirm') || textLower.includes('accept') || textLower.includes('proceed') || textLower.includes('yes') || textLower.includes('approved') || activeMission.currentStage === 'Quotation_Sent') {
        activeMission.currentStage = 'Order_Confirmed';
        activeMission.status = 'Completed';
        
        activeMission.milestones = activeMission.milestones || [];
        activeMission.milestones.push({
          timestamp: nowStr,
          stage: 'Order_Confirmed',
          text: `Customer ${customer.name} confirmed quotation via WhatsApp. Sales Order created.`,
          actor: 'Customer'
        });

        const orderNum = `SO-2026-${Math.floor(Math.random() * 9000 + 1000)}`;
        const salesOrder = await SalesOrderRepository.createOrder({
          id: `so-${Date.now()}`,
          orderNumber: orderNum,
          missionId: activeMission.id,
          customerName: customer.name,
          productName: activeMission.productName,
          quantity: activeMission.quantity || 500,
          unitPrice: 450,
          totalValue: activeMission.estimatedValue || (activeMission.quantity * 450),
          deliveryDate: activeMission.deliveryDate || 'Within 7 Days',
          location: activeMission.location || 'Peenya Industrial Area, Bangalore',
          status: 'Confirmed'
        });

        await SalesMissionRepository.saveMission(activeMission);

        // Send confirmation receipt to customer over WhatsApp
        const replyText = `✅ ORDER CONFIRMED!\n\nThank you ${customer.name}. Your Sales Order ${orderNum} for ${activeMission.quantity} units of ${activeMission.productName} has been locked into MissionOS ERP.\n\nTotal Order Value: ₹${salesOrder.totalValue.toLocaleString('en-IN')}\nTarget Delivery: ${salesOrder.deliveryDate}\n\nOur operations team will begin production scheduling immediately.`;
        await CommunicationService.sendWhatsAppMessage(customer.whatsappJid || customer.contactChannel, replyText, activeMission.id, 'Sales Agent');

        // CRITICAL REQUIREMENT: Publish SalesOrderConfirmed Business Event
        BusinessEventBus.publish({
          id: `evt-so-${salesOrder.id}`,
          type: 'SalesOrderConfirmed',
          timestamp: nowStr,
          source: 'Sales Department',
          summary: `Sales Order ${orderNum} confirmed for ${customer.name} (Value: ₹${salesOrder.totalValue.toLocaleString('en-IN')})`,
          details: {
            orderId: salesOrder.id,
            orderNumber: salesOrder.orderNumber,
            missionId: activeMission.id,
            customerName: customer.name,
            productName: activeMission.productName,
            quantity: activeMission.quantity,
            totalValue: salesOrder.totalValue,
            deliveryDate: salesOrder.deliveryDate,
            location: salesOrder.location
          },
          deepLink: '/sales-agent'
        });

        return { handled: true, reply: replyText };
      }
    }

    // STAGE 2: DETAIL GATHERING & PARSING
    const qtyMatch = messageText.match(/(\d+)\s*(pcs|units|pieces|brackets)?/i);
    if (qtyMatch && qtyMatch[1]) {
      const parsedQty = parseInt(qtyMatch[1], 10);
      if (parsedQty > 0) {
        activeMission.quantity = parsedQty;
        activeMission.estimatedValue = parsedQty * 450;
        activeMission.estimatedCost = parsedQty * 280;
        activeMission.estimatedMargin = activeMission.estimatedValue - activeMission.estimatedCost;
      }
    }

    if (textLower.includes('day') || textLower.includes('week') || textLower.includes('monday') || textLower.includes('aug') || textLower.includes('urgent') || textLower.includes('asap')) {
      activeMission.deliveryDate = messageText;
    }

    if (textLower.includes('bangalore') || textLower.includes('peenya') || textLower.includes('delhi') || textLower.includes('mumbai') || textLower.includes('finish') || textLower.includes('coating')) {
      activeMission.location = messageText;
    }

    // Determine missing details and generate natural conversation AI response
    let aiResponse = '';
    if (!activeMission.quantity || activeMission.quantity === 0) {
      activeMission.currentStage = 'Gathering_Details';
      aiResponse = `Hello ${customer.name}, thank you for your inquiry regarding ${activeMission.productName}. May I know your required order quantity?`;
    } else if (!activeMission.deliveryDate || activeMission.deliveryDate === 'Within 7 Days') {
      activeMission.currentStage = 'Gathering_Details';
      aiResponse = `Thank you ${customer.name}. We can manufacture ${activeMission.quantity} units of ${activeMission.productName}. What is your required target delivery date or timeframe?`;
    } else {
      // All details gathered -> Move to Margin Estimated & Quotation Draft Ready
      activeMission.currentStage = 'Margin_Estimated';
      activeMission.estimatedValue = activeMission.quantity * 450;
      activeMission.estimatedCost = activeMission.quantity * 280;
      activeMission.estimatedMargin = activeMission.estimatedValue - activeMission.estimatedCost;
      activeMission.marginConfidence = 'High (96%)';
      activeMission.businessReason = 'Standard 37.8% margin benchmark for precision CNC machining';

      aiResponse = `Thank you ${customer.name}. I have noted your requirement for ${activeMission.quantity} units of ${activeMission.productName} with target delivery (${activeMission.deliveryDate}). Our executive team is preparing your official quotation now.`;
    }

    activeMission.milestones = activeMission.milestones || [];
    activeMission.milestones.push({
      timestamp: nowStr,
      stage: activeMission.currentStage,
      text: `Customer: "${messageText}" | AI Response: "${aiResponse}"`,
      actor: 'Sales Agent'
    });

    await SalesMissionRepository.saveMission(activeMission);

    // Send AI reply over WhatsApp
    await CommunicationService.sendWhatsAppMessage(customer.whatsappJid || customer.contactChannel, aiResponse, activeMission.id, 'Sales Agent');

    return { handled: true, reply: aiResponse };
  }

  /**
   * Approves quotation draft and dispatches official quote to customer over WhatsApp.
   */
  static async approveQuotationAndSend(missionId: string): Promise<SalesMissionEntity> {
    const mission = await SalesMissionRepository.findById(missionId);
    if (!mission) throw new Error(`Sales Mission '${missionId}' not found.`);

    const nowStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    mission.currentStage = 'Quotation_Sent';

    const quoteMsg = `📋 OFFICIAL QUOTATION from Meenakshi Machining\n\nProduct: ${mission.productName}\nQuantity: ${mission.quantity} units\nUnit Price: ₹450/unit\nTotal Quotation Amount: ₹${mission.estimatedValue.toLocaleString('en-IN')}\nTarget Delivery: ${mission.deliveryDate || 'Within 7 Days'}\nDelivery Location: ${mission.location || 'Peenya, Bangalore'}\n\nPlease reply CONFIRMED to lock in this order.`;

    mission.milestones = mission.milestones || [];
    mission.milestones.push({
      timestamp: nowStr,
      stage: 'Quotation_Sent',
      text: `Owner approved quotation (Value: ₹${mission.estimatedValue.toLocaleString('en-IN')}). Official quote sent to ${mission.customerName} via WhatsApp.`,
      actor: 'Business Owner'
    });

    await SalesMissionRepository.saveMission(mission);

    // Dispatch quote via CommunicationService over WhatsApp
    await CommunicationService.sendWhatsAppMessage(mission.whatsappJid || mission.contactChannel, quoteMsg, mission.id, 'Sales Agent');

    return mission;
  }

  /**
   * Cancels a Sales Mission.
   */
  static async cancelMission(missionId: string): Promise<SalesMissionEntity> {
    const mission = await SalesMissionRepository.findById(missionId);
    if (!mission) throw new Error(`Sales Mission '${missionId}' not found.`);

    const nowStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    mission.status = 'Cancelled';
    mission.currentStage = 'Cancelled';

    mission.milestones = mission.milestones || [];
    mission.milestones.push({
      timestamp: nowStr,
      stage: 'Cancelled',
      text: `🛑 Sales Mission '${mission.id}' CANCELLED by business owner.`,
      actor: 'UI Action'
    });

    await SalesMissionRepository.saveMission(mission);
    return mission;
  }
}
