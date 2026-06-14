<?php

namespace App\Services;

use App\Models\CommunicationChannel;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageTemplate;
use App\Models\Lead;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OmnichannelService
{
    public function getConversations(array $filters = [])
    {
        $query = Conversation::with(['channel', 'lead', 'assignee']);

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (isset($filters['assigned_agent_id'])) {
            $query->where('assigned_agent_id', $filters['assigned_agent_id']);
        }

        return $query->orderBy('last_message_at', 'desc')->get();
    }

    public function getMessages(string $conversationId)
    {
        return Message::where('conversation_id', $conversationId)
            ->orderBy('created_at', 'asc')
            ->get();
    }

    public function createConversation(array $data): Conversation
    {
        return DB::transaction(function () use ($data) {
            // Find lead by phone or email
            $lead = Lead::where('phone', $data['customer_phone'])
                ->orWhere('email', $data['customer_email'] ?? '')
                ->first();

            $conv = Conversation::create([
                'id' => (string) Str::uuid(),
                'channel_id' => $data['channel_id'],
                'lead_id' => $lead ? $lead->id : null,
                'customer_phone' => $data['customer_phone'],
                'customer_email' => $data['customer_email'] ?? null,
                'customer_name' => $data['customer_name'] ?? ($lead ? "{$lead->first_name} {$lead->last_name}" : 'Unknown Customer'),
                'assigned_agent_id' => $data['assigned_agent_id'] ?? null,
                'status' => 'open',
                'last_message_at' => now(),
            ]);

            // Add initial message if provided
            if (!empty($data['initial_message'])) {
                Message::create([
                    'id' => (string) Str::uuid(),
                    'conversation_id' => $conv->id,
                    'direction' => 'inbound',
                    'sender_type' => 'customer',
                    'message_type' => 'text',
                    'content' => $data['initial_message'],
                    'status' => 'read',
                ]);
            }

            return $conv;
        });
    }

    public function sendMessage(string $conversationId, string $content, string $agentId, string $msgType = 'text', ?string $fileUrl = null): Message
    {
        return DB::transaction(function () use ($conversationId, $content, $agentId, $msgType, $fileUrl) {
            $conv = Conversation::findOrFail($conversationId);

            $message = Message::create([
                'id' => (string) Str::uuid(),
                'conversation_id' => $conv->id,
                'direction' => 'outbound',
                'sender_type' => 'agent',
                'sender_id' => $agentId,
                'message_type' => $msgType,
                'content' => $content,
                'file_url' => $fileUrl,
                'status' => 'sending',
            ]);

            // Simulate Outbound Gateway Dispatch
            // In production, this would call Twilio SMS, WhatsApp Business API or SMTP Mailers
            $this->dispatchMockGateway($conv->channel, $message);

            $message->update(['status' => 'delivered']);

            $conv->update([
                'last_message_at' => now(),
            ]);

            return $message;
        });
    }

    /**
     * Simulate dispatch logs depending on provider.
     */
    protected function dispatchMockGateway(CommunicationChannel $channel, Message $message): void
    {
        // e.g. Twilio API trigger
        // Log gateway dispatch simulation
    }

    public function getTemplates()
    {
        return MessageTemplate::all();
    }
}
