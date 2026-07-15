import { useCallback, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { Paperclip, Smile, Send, Mic, Square, X } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';

interface MessageInputProps {
  onSend: (body: string) => void;
  onTyping: () => void;
  onSendAttachment?: (file: File) => void;
  onSendVoice?: (blob: Blob) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, onTyping, onSendAttachment, onSendVoice, disabled }: MessageInputProps) {
  const [value, setValue] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const resetTextareaHeight = () => {
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleSend = useCallback(() => {
    if (pendingFile) {
      onSendAttachment?.(pendingFile);
      setPendingFile(null);
    }
    if (value.trim()) {
      onSend(value);
      setValue('');
    }
    resetTextareaHeight();
  }, [value, pendingFile, onSend, onSendAttachment]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    onTyping();
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleFilePick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPendingFile(file);
    e.target.value = ''; // allow picking the same file again later
  };

  const handleEmojiSelect = (emoji: string) => {
    setValue((v) => v + emoji);
    textareaRef.current?.focus();
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        if (blob.size > 0) onSendVoice?.(blob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access denied or unavailable:', err);
    }
  }, [onSendVoice]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
  }, []);

  const hasContent = value.trim().length > 0 || pendingFile !== null;

  return (
    <div className="border-t border-gray-200 bg-white p-3">
      {pendingFile && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
          <Paperclip className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 truncate">{pendingFile.name}</span>
          <button onClick={() => setPendingFile(null)} className="text-gray-400 hover:text-gray-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input ref={fileInputRef} type="file" onChange={handleFilePick} className="hidden" />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isRecording}
          title="Attach file"
          className="mb-1.5 shrink-0 rounded-full p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        <div className="relative flex-1">
          {isRecording ? (
            <div className="flex h-[42px] items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 text-sm text-red-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              Recording...
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder="Message..."
              rows={1}
              className="max-h-32 w-full resize-none rounded-xl border border-gray-200 px-3.5 py-2.5 pr-9 text-sm outline-none focus:border-howdy-500 focus:ring-1 focus:ring-howdy-500 disabled:bg-gray-50"
            />
          )}

          {!isRecording && (
            <button
              type="button"
              onClick={() => setIsEmojiOpen((v) => !v)}
              disabled={disabled}
              title="Emoji"
              className="absolute bottom-2 right-2 rounded-full p-1 text-gray-400 hover:text-gray-600 disabled:opacity-40"
            >
              <Smile className="h-5 w-5" />
            </button>
          )}

          {isEmojiOpen && (
            <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setIsEmojiOpen(false)} />
            // <EmojiPicker onEmojiClick={(emojiData) => onSelect(emojiData.emoji)} />
          )}
        </div>

        {hasContent ? (
          <button
            type="button"
            onClick={handleSend}
            disabled={disabled}
            className="mb-1.5 shrink-0 rounded-full bg-howdy-500 p-2.5 text-white transition hover:bg-howdy-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled}
            title={isRecording ? 'Stop recording' : 'Record voice message'}
            className={`mb-1.5 shrink-0 rounded-full p-2.5 text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${
              isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-howdy-500 hover:bg-howdy-600'
            }`}
          >
            {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
        )}
      </div>
    </div>
  );
}