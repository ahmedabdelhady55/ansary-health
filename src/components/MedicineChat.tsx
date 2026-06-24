import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Image } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { resolveSignedUrl } from '@/lib/storageUrl';

interface Props {
  onBack: () => void;
}

interface Message {
  id: string;
  message: string;
  sender_type: string;
  image_url?: string | null;
  created_at: string;
}

const PrescriptionImage = ({ value }: { value: string }) => {
  const [url, setUrl] = useState<string>('');
  useEffect(() => {
    let active = true;
    resolveSignedUrl('prescription-images', value).then(u => { if (active) setUrl(u); });
    return () => { active = false; };
  }, [value]);
  if (!url) return null;
  return <img src={url} alt="prescription" className="w-40 h-auto rounded-lg mb-2" />;
};

const MedicineChat = ({ onBack }: Props) => {
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load or create conversation
  useEffect(() => {
    if (!user) return;

    const init = async () => {
      try {
        // Check for existing open conversation
        const { data: existing, error: fetchErr } = await supabase
          .from('conversations')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(1);

        if (fetchErr) {
          console.error('Failed to fetch conversations', fetchErr);
          setLoading(false);
          return;
        }

        let convId: string;

        if (existing && existing.length > 0) {
          convId = existing[0].id;
        } else {
          const { data: newConv, error } = await supabase
            .from('conversations')
            .insert({
              user_id: user.id,
              user_name: profile?.name || '',
              user_phone: profile?.phone || '',
            })
            .select('id')
            .single();

          if (error || !newConv) {
            console.error('Failed to create conversation', error);
            setLoading(false);
            return;
          }
          convId = newConv.id;
        }

        setConversationId(convId);

        // Load existing messages
        const { data: msgs, error: msgsErr } = await supabase
          .from('conversation_messages')
          .select('*')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: true });

        if (msgsErr) console.error('Failed to load messages', msgsErr);
        if (msgs) setMessages(msgs as Message[]);
      } catch (e) {
        console.error('Chat init error', e);
      }
      setLoading(false);
    };

    init();
  }, [user, profile]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`conv-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !conversationId) return;
    const text = input.trim();
    setInput('');

    // Optimistic update
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      message: text,
      sender_type: 'user',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);

    const { error } = await supabase.from('conversation_messages').insert({
      conversation_id: conversationId,
      sender_type: 'user',
      message: text,
    });

    if (error) {
      console.error('Failed to send message', error);
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    }

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId || !user) return;

    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('prescription-images')
      .upload(path, file);

    if (uploadError) {
      console.error('Upload failed', uploadError);
      return;
    }

    // Store the storage path (bucket is private; we sign on read).
    await supabase.from('conversation_messages').insert({
      conversation_id: conversationId,
      sender_type: 'user',
      message: '📷 صورة روشتة',
      image_url: path,
    });

    e.target.value = '';
  };

  return (
    <div className="bg-card/90 backdrop-blur-md rounded-xl border border-border shadow-lg max-w-2xl mx-auto animate-fade-in overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <button onClick={onBack} className="p-1.5 rounded-lg bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
          <ArrowLeft size={18} />
        </button>
        <h2 className="font-heading font-bold text-foreground">{t('findMedicine')}</h2>
      </div>

      <div className="h-80 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <p className="text-center text-muted-foreground text-sm">جاري التحميل...</p>
        ) : messages.length === 0 ? (
          <div className="flex justify-start">
            <div className="max-w-[80%] px-3 py-2 rounded-xl text-sm bg-muted text-foreground rounded-bl-sm">
              مرحباً! اكتب اسم الدواء أو ارفع صورة الروشتة 📷
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                msg.sender_type === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted text-foreground rounded-bl-sm'
              }`}>
                {msg.image_url && <PrescriptionImage value={msg.image_url} />}
                {msg.message}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-border flex gap-2">
        <label className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors cursor-pointer">
          <Image size={18} />
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={t('typeMessage')}
          className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-ring outline-none"
        />
        <button onClick={handleSend} className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default MedicineChat;
