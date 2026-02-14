/**
 * Notification Service
 * Handles sending notifications to users when scheduled requests are created
 */

/**
 * Send notification to user about scheduled request creation
 * @param {Object} options - Notification options
 * @param {Object} options.user - User to notify
 * @param {Object} options.request - Request details
 * @param {Array} options.selectedWeekdays - Selected weekdays (0-6, Sunday-Saturday)
 * @returns {Promise<void>}
 */
export async function sendScheduleNotification({ user, request, selectedWeekdays = [] }) {
  try {
    // Get weekday names
    const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Build notification message
    let message = `Your scheduled request "${request.title}" has been created successfully.\n\n`;
    message += `Service Type: ${request.serviceType}\n`;
    message += `Priority: ${getPriorityName(request.priority)}\n`;
    
    if (request.scheduledDate) {
      const scheduledDate = new Date(request.scheduledDate);
      message += `Scheduled Date: ${scheduledDate.toLocaleDateString()}\n`;
    }
    
    if (request.scheduledTime) {
      message += `Scheduled Time: ${request.scheduledTime}\n`;
    }
    
    if (request.recurring) {
      message += `Recurring: Yes\n`;
      
      // Parse recurring pattern
      let patternText = '';
      try {
        const parsed = JSON.parse(request.recurringPattern);
        if (parsed.pattern === 'WEEKLY' && parsed.weekdays && parsed.weekdays.length > 0) {
          const dayNames = parsed.weekdays.map(w => weekdayNames[w]).join(', ');
          patternText = `Weekly on: ${dayNames}`;
        } else {
          patternText = parsed.pattern || request.recurringPattern;
        }
      } catch (e) {
        // If not JSON, use as-is
        if (request.recurringPattern === 'WEEKLY' && selectedWeekdays.length > 0) {
          const dayNames = selectedWeekdays.map(w => weekdayNames[w]).join(', ');
          patternText = `Weekly on: ${dayNames}`;
        } else {
          patternText = request.recurringPattern || 'Unknown';
        }
      }
      
      message += `Recurring Pattern: ${patternText}\n`;
      
      // Add weekday information if weekly
      if (selectedWeekdays.length > 0) {
        const dayNames = selectedWeekdays.map(w => weekdayNames[w]).join(', ');
        message += `\nYou will be notified on: ${dayNames}\n`;
      }
    }
    
    if (request.location) {
      message += `Location: ${request.location.name}\n`;
    }
    
    if (request.description) {
      message += `\nDescription: ${request.description}\n`;
    }
    
    message += `\nRequest ID: ${request.requestId}`;
    
    // Log notification (in production, you would send email/SMS here)
    console.log('📧 Notification sent to user:', user.email);
    console.log('📝 Notification message:', message);
    
    // TODO: Implement actual email/SMS sending here
    // Example email sending (requires nodemailer):
    // await sendEmail({
    //   to: user.email,
    //   subject: `Scheduled Request Created: ${request.title}`,
    //   text: message
    // });
    
    // Example SMS sending (requires Twilio or similar):
    // if (user.phoneNumber) {
    //   await sendSMS({
    //     to: user.phoneNumber,
    //     message: message
    //   });
    // }
    
    return { success: true, message };
  } catch (error) {
    console.error('Error sending notification:', error);
    // Don't throw error - notification failure shouldn't break request creation
    return { success: false, error: error.message };
  }
}

/**
 * Get priority name from priority number
 * @param {number} priority - Priority number (1-4)
 * @returns {string} Priority name
 */
function getPriorityName(priority) {
  const priorities = {
    1: 'Critical',
    2: 'High',
    3: 'Medium',
    4: 'Low'
  };
  return priorities[priority] || 'Medium';
}

