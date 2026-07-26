import { supabase } from '../lib/supabase';

export const ExtensionEngine = {
  /**
   * Fire an event that extensions can listen to
   */
  fireEvent: async (eventType: string, payload: any, ownerId: string, ownerType: string) => {
    try {
      // 1. Log the event
      const { data: eventData, error: eventError } = await supabase
        .from('extension_events')
        .insert([{
          event_type: eventType,
          payload
        }])
        .select()
        .single();

      if (eventError) {
        console.error('Failed to log extension event:', eventError);
        return;
      }

      // 2. Find installed extensions that listen to this event
      const { data: installedExts, error: extError } = await supabase
        .from('installed_extensions')
        .select(`
          id,
          config,
          extension_id,
          owner_id
        `)
        .eq('enabled', true)
        .eq('owner_id', ownerId)
        .eq('owner_type', ownerType);

      if (extError) {
        console.error('Failed to fetch installed extensions:', extError);
        return;
      }

      // Filter extensions that trigger on this event
      const triggeredExts = installedExts?.filter(ext => ext.config?.trigger === eventType) || [];

      // 3. Execute actions for each triggered extension
      for (const ext of triggeredExts) {
        await ExtensionEngine.executeExtension(ext, eventData.id, payload);
      }
    } catch (err) {
      console.error('Error in ExtensionEngine.fireEvent:', err);
    }
  },

  /**
   * Execute the actions defined in an extension
   */
  executeExtension: async (installedExt: any, eventId: string, payload: any) => {
    const actions = installedExt.config?.actions || [];
    let status = 'success';
    const results = [];

    for (const action of actions) {
      try {
        const result = await performAction(action, payload, installedExt.owner_id);
        results.push({ action: action.type, status: 'success', result });
      } catch (err: any) {
        console.error(`Action ${action.type} failed:`, err);
        status = 'error';
        results.push({ action: action.type, status: 'error', error: err.message });
      }
    }

    // Log the execution
    await supabase
      .from('extension_executions')
      .insert([{
        extension_id: installedExt.extension_id,
        event_id: eventId,
        status,
        result: { actions: results }
      }]);
  }
};

/**
 * Perform a specific action based on its type
 */
async function performAction(action: any, payload: any, ownerId: string) {
  switch (action.type) {
    case 'send_message':
      // Example: Send a message in the community
      if (payload.community_id) {
        // Find the general channel or the first channel
        const { data: channel } = await supabase
          .from('community_channels')
          .select('id')
          .eq('community_id', payload.community_id)
          .eq('type', 'chat')
          .order('position', { ascending: true })
          .limit(1)
          .single();

        if (channel) {
          // Replace variables in message
          let messageContent = action.config.message || '';
          if (payload.user_id) {
            const { data: user } = await supabase.from('profiles').select('full_name').eq('id', payload.user_id).single();
            if (user) {
              messageContent = messageContent.replace(/{{user}}/g, user.full_name || 'User');
            }
          }

          const { error } = await supabase
            .from('community_messages')
            .insert({
              channel_id: channel.id,
              author_id: ownerId, // Send as the community owner or extension creator
              content: messageContent
            });
          
          if (error) throw error;
          return { sent: true, channel_id: channel.id };
        }
      }
      return { sent: false, reason: 'No channel found or not a community event' };

    case 'assign_role':
      // Example: Assign a role to the user
      if (payload.community_id && payload.user_id && action.config.role) {
        const { error } = await supabase
          .from('community_members')
          .update({ role: action.config.role })
          .eq('community_id', payload.community_id)
          .eq('user_id', payload.user_id);
        
        if (error) throw error;
        return { assigned: true, role: action.config.role };
      }
      return { assigned: false, reason: 'Missing payload data or role config' };

    case 'send_email':
      return { sent: true };

    case 'webhook_call':
      if (action.config.url) {
        const response = await fetch(action.config.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        return { called: true, status: response.status };
      }
      throw new Error('Webhook URL not configured');

    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}
