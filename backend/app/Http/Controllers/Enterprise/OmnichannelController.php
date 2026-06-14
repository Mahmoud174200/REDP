<?php

namespace App\Http\Controllers\Enterprise;

use App\Http\Controllers\Controller;
use App\Services\OmnichannelService;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\CommunicationChannel;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OmnichannelController extends Controller
{
    protected OmnichannelService $service;

    public function __construct(OmnichannelService $service)
    {
        $this->service = $service;
    }

    public function getConversations(Request $request)
    {
        $filters = $request->only(['status', 'assigned_agent_id']);
        $conversations = $this->service->getConversations($filters);

        // Fetch channels if needed
        $channels = CommunicationChannel::all();

        return response()->json([
            'success' => true,
            'data' => $conversations,
            'channels' => $channels
        ]);
    }

    public function getMessages(string $id)
    {
        $messages = $this->service->getMessages($id);

        return response()->json([
            'success' => true,
            'data' => $messages
        ]);
    }

    public function sendMessage(Request $request, string $id)
    {
        $validated = $request->validate([
            'content' => 'required|string',
            'message_type' => 'sometimes|required|in:text,image,document,location,audio',
            'file_url' => 'nullable|string',
        ]);

        $message = $this->service->sendMessage(
            $id,
            $validated['content'],
            $request->user()->id,
            $validated['message_type'] ?? 'text',
            $validated['file_url'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => 'Message sent successfully',
            'data' => $message
        ], 211);
    }

    public function storeConversation(Request $request)
    {
        $validated = $request->validate([
            'channel_id' => 'required|uuid|exists:communication_channels,id',
            'customer_phone' => 'required|string',
            'customer_email' => 'nullable|string|email',
            'customer_name' => 'nullable|string',
            'initial_message' => 'nullable|string',
        ]);

        $validated['assigned_agent_id'] = $request->user()->id;
        $conversation = $this->service->createConversation($validated);

        return response()->json([
            'success' => true,
            'message' => 'Conversation started successfully',
            'data' => $conversation
        ], 211);
    }

    public function getTemplates()
    {
        $templates = $this->service->getTemplates();

        return response()->json([
            'success' => true,
            'data' => $templates
        ]);
    }

    /**
     * Simulate an incoming customer message for dry-run testing.
     */
    public function receiveMockMessage(Request $request)
    {
        $validated = $request->validate([
            'conversation_id' => 'required|uuid|exists:conversations,id',
            'content' => 'required|string',
            'message_type' => 'sometimes|required|in:text,image',
        ]);

        $conv = Conversation::findOrFail($validated['conversation_id']);

        $message = Message::create([
            'id' => (string) Str::uuid(),
            'conversation_id' => $conv->id,
            'direction' => 'inbound',
            'sender_type' => 'customer',
            'message_type' => $validated['message_type'] ?? 'text',
            'content' => $validated['content'],
            'status' => 'delivered',
        ]);

        $conv->update([
            'last_message_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Simulated customer response received',
            'data' => $message
        ], 211);
    }
}
