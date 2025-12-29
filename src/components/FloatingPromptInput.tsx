import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Maximize2,
  Minimize2,
  Sparkles,
  Zap,
  Square,
  Brain,
  Lightbulb,
  Cpu,
  Rocket
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { TooltipProvider, TooltipSimple } from "@/components/ui/tooltip-modern";
import { FilePicker } from "./FilePicker";
import { SlashCommandPicker } from "./SlashCommandPicker";
import { ImagePreview } from "./ImagePreview";
import { type FileEntry, type SlashCommand, api, type ModelInfo } from "@/lib/api";

// Conditional import for Tauri webview window
let tauriGetCurrentWebviewWindow: any;
try {
  if (typeof window !== 'undefined' && window.__TAURI__) {
    tauriGetCurrentWebviewWindow = require("@tauri-apps/api/webviewWindow").getCurrentWebviewWindow;
  }
} catch (e) {
  console.log('[FloatingPromptInput] Tauri webview API not available, using web mode');
}

// Web-compatible replacement
const getCurrentWebviewWindow = tauriGetCurrentWebviewWindow || (() => ({ listen: () => Promise.resolve(() => { }) }));


interface FloatingPromptInputProps {
  /**
   * Callback when prompt is sent
   */
  onSend: (prompt: string, model: string, thinkingMode?: string) => void;
  /**
   * Whether the input is loading
   */
  isLoading?: boolean;
  /**
   * Whether the input is disabled
   */
  disabled?: boolean;
  /**
   * Default model to select
   */
  defaultModel?: string;
  /**
   * Project path for file picker
   */
  projectPath?: string | null;
  /**
   * Callback when loading is cancelled
   */
  onCancel?: () => void;
  /**
   * Extra menu items on the right
   */
  extraMenuItems?: React.ReactNode;
  /**
   * Callback on url change
   */
  onUrlChange?: (url: string) => void;
  /**
   * Additional className
   */
  className?: string;
  /**
   * Whether the position should be fixed at bottom
   */
  isFixed?: boolean;
}

export interface FloatingPromptInputRef {
  addImage: (imagePath: string) => void;
}

/**
 * Thinking mode type definition
 */
type ThinkingMode = "auto" | "think" | "think_hard" | "think_harder" | "ultrathink";

/**
 * Thinking mode configuration
 */
type ThinkingModeConfig = {
  id: ThinkingMode;
  name: string;
  description: string;
  level: number; // 0-4 for visual indicator
  phrase?: string; // The phrase to append
  icon: React.ReactNode;
  color: string;
  shortName: string;
};

const THINKING_MODES: ThinkingModeConfig[] = [
  {
    id: "auto",
    name: "Auto",
    description: "Let Claude decide",
    level: 0,
    icon: <Sparkles className="h-3.5 w-3.5" />,
    color: "text-muted-foreground",
    shortName: "A"
  },
  {
    id: "think",
    name: "Think",
    description: "Basic reasoning",
    level: 1,
    phrase: "think",
    icon: <Lightbulb className="h-3.5 w-3.5" />,
    color: "text-primary",
    shortName: "T"
  },
  {
    id: "think_hard",
    name: "Think Hard",
    description: "Deeper analysis",
    level: 2,
    phrase: "think harder",
    icon: <Brain className="h-3.5 w-3.5" />,
    color: "text-primary",
    shortName: "T+"
  },
  {
    id: "think_harder",
    name: "Think Harder",
    description: "Extensive reasoning",
    level: 3,
    phrase: "think harder",
    icon: <Cpu className="h-3.5 w-3.5" />,
    color: "text-primary",
    shortName: "T++"
  },
  {
    id: "ultrathink",
    name: "Ultrathink",
    description: "Maximum computation",
    level: 4,
    phrase: "ultrathink",
    icon: <Rocket className="h-3.5 w-3.5" />,
    color: "text-primary",
    shortName: "Ultra"
  }
];

/**
 * ThinkingModeIndicator component - Shows visual indicator bars for thinking level
 */
const ThinkingModeIndicator: React.FC<{ level: number; color?: string }> = ({ level, color: _color }) => {
  const getBarColor = (barIndex: number) => {
    if (barIndex > level) return "bg-muted";
    return "bg-primary";
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={cn(
            "w-1 h-3 rounded-full transition-all duration-200",
            getBarColor(i),
            i <= level && "shadow-sm"
          )}
        />
      ))}
    </div>
  );
};

// Simplified Default Models (fallback) with new 4.5 versions
const DEFAULT_MODELS: ModelInfo[] = [
  { id: "claude-sonnet-4-5-20250929", display_name: "Claude Sonnet 4.5", created_at: "", type: "model" },
  { id: "claude-opus-4-5-20251101", display_name: "Claude Opus 4.5", created_at: "", type: "model" },
  { id: "claude-haiku-4-5-20251001", display_name: "Claude Haiku 4.5", created_at: "", type: "model" }
];

/**
 * FloatingPromptInput component - Fixed position prompt input with model picker
 */

interface Attachment {
  path: string;
  preview?: string;
}

const FloatingPromptInputInner = (
  {
    onSend,
    isLoading = false,
    disabled = false,
    defaultModel = "claude-sonnet-4-5-20250929",
    projectPath,
    className,
    onCancel,
    extraMenuItems,
    isFixed = true,
  }: FloatingPromptInputProps,
  ref: React.Ref<FloatingPromptInputRef>,
) => {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('last_selected_model');
      if (saved) return saved;
    }
    return defaultModel;
  });
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [selectedThinkingMode, setSelectedThinkingMode] = useState<ThinkingMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('last_selected_thinking_mode');
      if (saved) return saved as ThinkingMode;
    }
    return "auto";
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [thinkingModePickerOpen, setThinkingModePickerOpen] = useState(false);

  // Persist model and thinking mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('last_selected_model', selectedModel);
      localStorage.setItem('last_selected_thinking_mode', selectedThinkingMode);
    }
  }, [selectedModel, selectedThinkingMode]);
  const [showFilePicker, setShowFilePicker] = useState(false);

  useEffect(() => {
    console.log("FloatingPromptInput: mounting, fetching models v3 - FORCED UPDATE");
    api.listAnthropicModels()
      .then(res => {
        if (res && res.data && res.data.length > 0) {
          setAvailableModels(res.data);
        } else {
          console.log("No models returned, using defaults");
          setAvailableModels(DEFAULT_MODELS);
        }
      })
      .catch(e => {
        console.error("Failed to fetch models, using defaults", e);
        setAvailableModels(DEFAULT_MODELS);
      });
  }, []);
  const [filePickerQuery, setFilePickerQuery] = useState("");
  const [pickerTrigger, setPickerTrigger] = useState<'@' | '#'>('@');
  const [showSlashCommandPicker, setShowSlashCommandPicker] = useState(false);
  const [slashCommandQuery, setSlashCommandQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [embeddedImages, setEmbeddedImages] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const expandedTextareaRef = useRef<HTMLTextAreaElement>(null);
  const unlistenDragDropRef = useRef<(() => void) | null>(null);
  const [textareaHeight, setTextareaHeight] = useState<number>(48);
  const isIMEComposingRef = useRef(false);

  // Expose a method to add images programmatically
  React.useImperativeHandle(
    ref,
    () => ({
      addImage: (imagePath: string) => {
        setAttachments(prev => {
          if (prev.some(a => a.path === imagePath)) return prev;
          return [...prev, { path: imagePath }];
        });

        // Focus the textarea
        setTimeout(() => {
          const target = isExpanded ? expandedTextareaRef.current : textareaRef.current;
          target?.focus();
        }, 0);
      }
    }),
    [isExpanded]
  );

  // Helper function to check if a file is an image
  const isImageFile = (path: string): boolean => {
    // Check if it's a data URL
    if (path.startsWith('data:image/')) {
      return true;
    }
    // Otherwise check file extension
    const ext = path.split('.').pop()?.toLowerCase();
    return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp'].includes(ext || '');
  };

  // Extract image paths from prompt text
  const extractImagePaths = (text: string): string[] => {
    console.log('[extractImagePaths] Input text length:', text.length);

    // Updated regex to handle both quoted and unquoted paths
    // Pattern 1: @"path with spaces or data URLs" - quoted paths
    // Pattern 2: @path - unquoted paths (continues until @ or end)
    // Temporarily disabled regex to isolate Safari crash
    const quotedRegex = /@"([^"]+)"/g;
    const unquotedRegex = /@([^@\n\s]+)/g;
    return [];

    const pathsSet = new Set<string>(); // Use Set to ensure uniqueness

    // First, extract quoted paths (including data URLs)
    let matches = Array.from(text.matchAll(quotedRegex));
    console.log('[extractImagePaths] Quoted matches:', matches.length);

    for (const match of matches) {
      const path = match[1]; // No need to trim, quotes preserve exact path
      console.log('[extractImagePaths] Processing quoted path:', path.startsWith('data:') ? 'data URL' : path);

      // For data URLs, use as-is; for file paths, convert to absolute
      const fullPath = path.startsWith('data:')
        ? path
        : (path.startsWith('/') ? path : (projectPath ? `${projectPath}/${path}` : path));

      if (isImageFile(fullPath)) {
        pathsSet.add(fullPath);
      }
    }

    // Remove quoted mentions from text to avoid double-matching
    let textWithoutQuoted = text.replace(quotedRegex, '');

    // Then extract unquoted paths (typically file paths)
    matches = Array.from(textWithoutQuoted.matchAll(unquotedRegex));
    console.log('[extractImagePaths] Unquoted matches:', matches.length);

    for (const match of matches) {
      const path = match[1].trim();
      // Skip if it looks like a data URL fragment (shouldn't happen with proper quoting)
      if (path.includes('data:')) continue;

      console.log('[extractImagePaths] Processing unquoted path:', path);

      // Convert relative path to absolute if needed
      const fullPath = path.startsWith('/') ? path : (projectPath ? `${projectPath}/${path}` : path);

      if (isImageFile(fullPath)) {
        pathsSet.add(fullPath);
      }
    }

    const uniquePaths = Array.from(pathsSet);
    console.log('[extractImagePaths] Final extracted paths (unique):', uniquePaths.length);
    return uniquePaths;
  };

  // Update embedded images when prompt changes
  useEffect(() => {
    console.log('[useEffect] Prompt changed:', prompt);
    const imagePaths = extractImagePaths(prompt);
    console.log('[useEffect] Setting embeddedImages to:', imagePaths);
    setEmbeddedImages(imagePaths);

    // Auto-resize on prompt change (handles paste, programmatic changes, etc.)
    if (textareaRef.current && !isExpanded) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const newHeight = Math.min(Math.max(scrollHeight, 48), 240);
      setTextareaHeight(newHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [prompt, projectPath, isExpanded]);

  // Set up Tauri drag-drop event listener
  useEffect(() => {
    // This effect runs only once on component mount to set up the listener.
    let lastDropTime = 0;

    const setupListener = async () => {
      try {
        // If a listener from a previous mount/render is still around, clean it up.
        if (unlistenDragDropRef.current) {
          unlistenDragDropRef.current();
        }

        const webview = getCurrentWebviewWindow();
        unlistenDragDropRef.current = await webview.onDragDropEvent((event: any) => {
          if (event.payload.type === 'enter' || event.payload.type === 'over') {
            setDragActive(true);
          } else if (event.payload.type === 'leave') {
            setDragActive(false);
          } else if (event.payload.type === 'drop' && event.payload.paths) {
            setDragActive(false);

            const currentTime = Date.now();
            if (currentTime - lastDropTime < 200) {
              // This debounce is crucial to handle the storm of drop events
              // that Tauri/OS can fire for a single user action.
              return;
            }
            lastDropTime = currentTime;

            const droppedPaths = event.payload.paths as string[];
            const imagePaths = droppedPaths.filter(isImageFile);

            if (imagePaths.length > 0) {
              setAttachments(prev => {
                const newPaths = imagePaths.filter(p => !prev.some(a => a.path === p));
                return [...prev, ...newPaths.map(p => ({ path: p }))];
              });

              setTimeout(() => {
                const target = isExpanded ? expandedTextareaRef.current : textareaRef.current;
                target?.focus();
              }, 0);
            }
          }
        });
      } catch (error) {
        console.error('Failed to set up Tauri drag-drop listener:', error);
      }
    };

    setupListener();

    return () => {
      // On unmount, ensure we clean up the listener.
      if (unlistenDragDropRef.current) {
        unlistenDragDropRef.current();
        unlistenDragDropRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only on mount/unmount.

  useEffect(() => {
    // Focus the appropriate textarea when expanded state changes
    if (isExpanded && expandedTextareaRef.current) {
      expandedTextareaRef.current.focus();
    } else if (!isExpanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isExpanded]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newCursorPosition = e.target.selectionStart || 0;

    // Auto-resize textarea based on content
    if (textareaRef.current && !isExpanded) {
      // Reset height to auto to get the actual scrollHeight
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      // Set min height to 48px and max to 240px (about 10 lines)
      const newHeight = Math.min(Math.max(scrollHeight, 48), 240);
      setTextareaHeight(newHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }

    // Check if / was just typed at the beginning of input or after whitespace
    if (newValue.length > prompt.length && newValue[newCursorPosition - 1] === '/') {
      // Check if it's at the start or after whitespace
      const isStartOfCommand = newCursorPosition === 1 ||
        (newCursorPosition > 1 && /\s/.test(newValue[newCursorPosition - 2]));

      if (isStartOfCommand) {
        console.log('[FloatingPromptInput] / detected for slash command');
        setShowSlashCommandPicker(true);
        setSlashCommandQuery("");
        setCursorPosition(newCursorPosition);
      }
    }

    // Check if @ was just typed
    if (projectPath?.trim() && newValue.length > prompt.length && newValue[newCursorPosition - 1] === '@') {
      console.log('[FloatingPromptInput] @ detected, projectPath:', projectPath);
      setShowFilePicker(true);
      setFilePickerQuery("");
      setPickerTrigger('@');
      setCursorPosition(newCursorPosition);
    }

    // Check if # was just typed
    if (projectPath?.trim() && newValue.length > prompt.length && newValue[newCursorPosition - 1] === '#') {
      console.log('[FloatingPromptInput] # detected, projectPath:', projectPath);
      setShowFilePicker(true);
      setFilePickerQuery("");
      setPickerTrigger('#');
      setCursorPosition(newCursorPosition);
    }

    // Check if we're typing after / (for slash command search)
    if (showSlashCommandPicker && newCursorPosition >= cursorPosition) {
      // Find the / position before cursor
      let slashPosition = -1;
      for (let i = newCursorPosition - 1; i >= 0; i--) {
        if (newValue[i] === '/') {
          slashPosition = i;
          break;
        }
        // Stop if we hit whitespace (new word)
        if (newValue[i] === ' ' || newValue[i] === '\n') {
          break;
        }
      }

      if (slashPosition !== -1) {
        const query = newValue.substring(slashPosition + 1, newCursorPosition);
        setSlashCommandQuery(query);
      } else {
        // / was removed or cursor moved away
        setShowSlashCommandPicker(false);
        setSlashCommandQuery("");
      }
    }

    // Check if we're typing after trigger (for search query)
    if (showFilePicker && newCursorPosition >= cursorPosition) {
      // Find the trigger position before cursor
      let triggerPosition = -1;
      for (let i = newCursorPosition - 1; i >= 0; i--) {
        if (newValue[i] === pickerTrigger) {
          triggerPosition = i;
          break;
        }
        // Stop if we hit whitespace (new word)
        if (newValue[i] === ' ' || newValue[i] === '\n') {
          break;
        }
      }

      if (triggerPosition !== -1) {
        const query = newValue.substring(triggerPosition + 1, newCursorPosition);
        setFilePickerQuery(query);
      } else {
        // Trigger was removed or cursor moved away
        setShowFilePicker(false);
        setFilePickerQuery("");
      }
    }

    setPrompt(newValue);
    setCursorPosition(newCursorPosition);
  };

  const handleFileSelect = (entry: FileEntry) => {
    if (textareaRef.current) {
      // Find the trigger position before cursor
      let triggerPosition = -1;
      for (let i = cursorPosition - 1; i >= 0; i--) {
        if (prompt[i] === pickerTrigger) {
          triggerPosition = i;
          break;
        }
        // Stop if we hit whitespace (new word)
        if (prompt[i] === ' ' || prompt[i] === '\n') {
          break;
        }
      }

      if (triggerPosition === -1) {
        // Trigger not found
        console.error('[FloatingPromptInput] Trigger position not found');
        return;
      }

      // Replace the trigger and partial query with the selected path (file or directory)
      const textarea = textareaRef.current;
      const beforeTrigger = prompt.substring(0, triggerPosition);
      const afterCursor = prompt.substring(cursorPosition);
      const relativePath = entry.path.startsWith(projectPath || '')
        ? entry.path.slice((projectPath || '').length + 1)
        : entry.path;

      // Always use @ for file context, even if triggered by #
      const prefix = '@';
      const newPrompt = `${beforeTrigger}${prefix}${relativePath} ${afterCursor}`;
      setPrompt(newPrompt);
      setShowFilePicker(false);
      setFilePickerQuery("");

      // Focus back on textarea and set cursor position after the inserted path
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = beforeTrigger.length + relativePath.length + 2; // +2 for trigger and space
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const handleFilePickerClose = () => {
    setShowFilePicker(false);
    setFilePickerQuery("");
    // Return focus to textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleSlashCommandSelect = (command: SlashCommand) => {
    const textarea = isExpanded ? expandedTextareaRef.current : textareaRef.current;
    if (!textarea) return;

    // Find the / position before cursor
    let slashPosition = -1;
    for (let i = cursorPosition - 1; i >= 0; i--) {
      if (prompt[i] === '/') {
        slashPosition = i;
        break;
      }
      // Stop if we hit whitespace (new word)
      if (prompt[i] === ' ' || prompt[i] === '\n') {
        break;
      }
    }

    if (slashPosition === -1) {
      console.error('[FloatingPromptInput] / position not found');
      return;
    }

    // Simply insert the command syntax
    const beforeSlash = prompt.substring(0, slashPosition);
    const afterCursor = prompt.substring(cursorPosition);

    if (command.accepts_arguments) {
      // Insert command with placeholder for arguments
      const newPrompt = `${beforeSlash}${command.full_command} `;
      setPrompt(newPrompt);
      setShowSlashCommandPicker(false);
      setSlashCommandQuery("");

      // Focus and position cursor after the command
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = beforeSlash.length + command.full_command.length + 1;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      // Insert command and close picker
      const newPrompt = `${beforeSlash}${command.full_command} ${afterCursor}`;
      setPrompt(newPrompt);
      setShowSlashCommandPicker(false);
      setSlashCommandQuery("");

      // Focus and position cursor after the command
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = beforeSlash.length + command.full_command.length + 1;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const handleSlashCommandPickerClose = () => {
    setShowSlashCommandPicker(false);
    setSlashCommandQuery("");
    // Return focus to textarea
    setTimeout(() => {
      const textarea = isExpanded ? expandedTextareaRef.current : textareaRef.current;
      textarea?.focus();
    }, 0);
  };

  const handleCompositionStart = () => {
    isIMEComposingRef.current = true;
  };

  const handleCompositionEnd = () => {
    setTimeout(() => {
      isIMEComposingRef.current = false;
    }, 0);
  };

  const isIMEInteraction = (event?: React.KeyboardEvent) => {
    if (isIMEComposingRef.current) {
      return true;
    }

    if (!event) {
      return false;
    }

    const nativeEvent = event.nativeEvent;

    if (nativeEvent.isComposing) {
      return true;
    }

    const key = nativeEvent.key;
    if (key === 'Process' || key === 'Unidentified') {
      return true;
    }

    const keyboardEvent = nativeEvent as unknown as KeyboardEvent;
    const keyCode = keyboardEvent.keyCode ?? (keyboardEvent as unknown as { which?: number }).which;
    if (keyCode === 229) {
      return true;
    }

    return false;
  };

  const handleSend = () => {
    if (isIMEInteraction()) {
      return;
    }

    if ((prompt.trim() || attachments.length > 0) && !disabled) {
      let finalPrompt = prompt.trim();

      // Append thinking phrase if not auto mode
      const thinkingMode = THINKING_MODES.find(m => m.id === selectedThinkingMode);
      if (thinkingMode && thinkingMode.phrase) {
        finalPrompt = `${finalPrompt}.\n\n${thinkingMode.phrase}.`;
      }

      // Append attachments
      if (attachments.length > 0) {
        const attachmentMentions = attachments.map(p => {
          const path = p.path;
          return path.includes(' ') ? `@"${path}"` : `@${path}`;
        }).join(' ');

        // Add a newline before attachments if there is text, to match style cleanly or just space
        // Space is fine for CLI arguments usually.
        finalPrompt = `${finalPrompt} ${attachmentMentions}`.trim();
      }

      onSend(finalPrompt, selectedModel);
      setPrompt("");
      setAttachments([]);
      setEmbeddedImages([]);
      setTextareaHeight(48); // Reset height after sending
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showFilePicker && e.key === 'Escape') {
      e.preventDefault();
      setShowFilePicker(false);
      setFilePickerQuery("");
      return;
    }

    if (showSlashCommandPicker && e.key === 'Escape') {
      e.preventDefault();
      setShowSlashCommandPicker(false);
      setSlashCommandQuery("");
      return;
    }

    // Add keyboard shortcut for expanding
    if (e.key === 'e' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
      e.preventDefault();
      setIsExpanded(true);
      return;
    }

    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !isExpanded &&
      !showFilePicker &&
      !showSlashCommandPicker
    ) {
      if (isIMEInteraction(e)) {
        return;
      }
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();

        // Get the image blob
        const blob = item.getAsFile();
        if (!blob) continue;

        try {
          // Convert blob to base64
          const reader = new FileReader();
          reader.onload = async () => {
            const base64Data = reader.result as string;

            try {
              // Upload to temp storage and get path
              const fileName = blob.name !== 'image.png' ? blob.name : undefined;
              console.log('[FloatingPromptInput] Saving pasted image...');
              const savedPath = await api.saveTempImage(base64Data, fileName);
              console.log('[FloatingPromptInput] Image saved to:', savedPath);

              setAttachments(prev => [...prev, { path: savedPath, preview: base64Data }]);

              // Focus the textarea
              setTimeout(() => {
                const target = isExpanded ? expandedTextareaRef.current : textareaRef.current;
                target?.focus();
              }, 0);
            } catch (err) {
              console.error('Failed to save/upload pasted image:', err);
            }
          };

          reader.readAsDataURL(blob);
        } catch (error) {
          console.error('Failed to paste image:', error);
        }
      }
    }
  };

  // Browser drag and drop handlers - just prevent default behavior
  // Actual file handling is done via Tauri's window-level drag-drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Visual feedback is handled by Tauri events
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // File processing is handled by Tauri's onDragDropEvent
  };

  const handleRemoveImage = (index: number) => {
    // Handle attachments (state-based)
    if (index >= embeddedImages.length) {
      const attachIndex = index - embeddedImages.length;
      setAttachments(prev => prev.filter((_, i) => i !== attachIndex));
      return;
    }

    // Handle embedded images (text-based)
    // Remove the corresponding @mention from the prompt
    const imagePath = embeddedImages[index];
    let newPrompt = prompt;

    // For data URLs, we need to handle them specially since they're always quoted
    if (imagePath.startsWith('data:')) {
      // Simply remove the exact quoted data URL
      const quotedPath = `@"${imagePath}"`;
      newPrompt = newPrompt.replace(quotedPath, '').trim();
      setPrompt(newPrompt);
      return;
    }

    // For file paths
    // We need to look for variations: quoted vs unquoted, absolute vs relative
    // Instead of Regex which can be flaky with special chars in Safari, we'll try direct string replacement
    const targets = [
      `@"${imagePath}"`, // Quoted full
      `@${imagePath}`,   // Unquoted full
    ];

    if (projectPath) {
      // Try relative path versions too
      const relativePath = imagePath.replace(projectPath + '/', '');
      if (relativePath !== imagePath) {
        targets.push(`@"${relativePath}"`);
        targets.push(`@${relativePath}`);
      }
    }

    // Attempt to remove targets
    for (const target of targets) {
      if (newPrompt.includes(target)) {
        // Replace only the first occurrence or all? Ideally specific one, but for now replace generic
        // We can use split/join to remove all instances
        newPrompt = newPrompt.split(target).join('').trim();
        // If we found a match, we can stop - typically there's only one
        break;
      }
    }

    // Clean up double spaces that might be left
    newPrompt = newPrompt.replace(/\s{2,}/g, ' ');

    setPrompt(newPrompt.trim());
  };


  const getModelMetadata = (modelId: string) => {
    if (modelId.includes("sonnet")) {
      return { icon: <Zap className="h-3.5 w-3.5" />, color: "text-primary", shortName: "S" };
    } else if (modelId.includes("opus")) {
      return { icon: <Zap className="h-3.5 w-3.5" />, color: "text-primary", shortName: "O" };
    } else if (modelId.includes("haiku")) {
      return { icon: <Zap className="h-3.5 w-3.5" />, color: "text-primary", shortName: "H" };
    }
    return { icon: <Zap className="h-3.5 w-3.5" />, color: "text-muted-foreground", shortName: "M" };
  };

  const selectedModelData = availableModels.find(m => m.id === selectedModel) || availableModels[0] || DEFAULT_MODELS[0];
  const selectedModelMeta = getModelMetadata(selectedModelData.id);

  return (
    <TooltipProvider>
      <>
        {/* Expanded View Modal Overlay */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsExpanded(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-4xl h-[60vh] flex flex-col glass-card rounded-2xl overflow-hidden shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-4 border-b">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Maximize2 className="h-4 w-4" />
                    Expanded Message
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsExpanded(false)}
                    className="h-8 w-8 rounded-full"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Image previews in expanded mode */}
                {(embeddedImages.length > 0 || attachments.length > 0) && (
                  <div className="px-6 pt-4">
                    <ImagePreview
                      images={[...embeddedImages, ...attachments.map(a => a.preview || a.path)]}
                      onRemove={handleRemoveImage}
                      className="border border-border/40 bg-card/40 backdrop-blur-md rounded-xl p-2"
                    />
                  </div>
                )}

                <div className="flex-1 overflow-hidden relative">
                  <Textarea
                    ref={expandedTextareaRef}
                    value={prompt}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    onCompositionStart={handleCompositionStart}
                    onCompositionEnd={handleCompositionEnd}
                    onPaste={handlePaste}
                    placeholder="Type your message..."
                    className="h-full w-full resize-none p-6 bg-transparent border-none focus-visible:ring-0 text-lg leading-relaxed placeholder:text-muted-foreground/30"
                  />
                </div>

                <div className="p-4 border-t flex justify-end gap-2 bg-muted/20">
                  <TooltipSimple content="Press Esc to close" side="top">
                    <div className="text-[10px] text-muted-foreground self-center mr-4 uppercase tracking-widest font-bold">
                      ESC TO CLOSE
                    </div>
                  </TooltipSimple>
                  <Button
                    variant="ghost"
                    onClick={() => setIsExpanded(false)}
                    className="rounded-xl px-4"
                  >
                    Cancel
                  </Button>
                  <TooltipSimple content="Send message" side="top">
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => {
                          handleSend();
                          setIsExpanded(false);
                        }}
                        disabled={isLoading || !prompt.trim() || disabled}
                        variant="default"
                        className="rounded-xl px-6 gap-2 shadow-lg"
                      >
                        {isLoading ? (
                          <Square className="h-4 w-4 fill-current" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Send Message
                      </Button>
                    </motion.div>
                  </TooltipSimple>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fixed Position Input Bar */}
        <div
          className={cn(
            isFixed ? "fixed bottom-0 left-0 right-0 z-40 pb-6" : "relative w-full z-10 py-4",
            "transition-all duration-300",
            dragActive && "scale-[1.01]",
            className
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="container mx-auto max-w-6xl px-4">
            {/* Image previews */}
            <AnimatePresence>
              {(embeddedImages.length > 0 || attachments.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="mb-2"
                >
                  <ImagePreview
                    images={[...embeddedImages, ...attachments.map(a => a.preview || a.path)]}
                    onRemove={handleRemoveImage}
                    className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md shadow-lg overflow-hidden"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div
              className={cn(
                "relative group rounded-2xl border border-border/80 shadow-2xl transition-all duration-300",
                "backdrop-blur-xl"
              )}
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-card), transparent 10%)'
              }}
            >
              <div className="flex flex-col">
                {/* Input Area */}
                <div className="flex items-start gap-3 p-4">
                  {/* Model & Thinking Mode Selectors */}
                  <div className="flex items-center gap-2 shrink-0 pt-1">
                    <Popover
                      trigger={
                        <TooltipSimple content="Select Model" side="top">
                          <motion.div whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={disabled}
                              className={cn(
                                "h-9 w-9 p-0 rounded-xl flex items-center justify-center border transition-all duration-200",
                                modelPickerOpen
                                  ? "border-primary/30 shadow-sm"
                                  : "bg-transparent border-transparent hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                              )}
                              style={{
                                backgroundColor: modelPickerOpen
                                  ? 'color-mix(in srgb, var(--color-primary), transparent 85%)'
                                  : undefined
                              }}
                            >
                              <span className={cn("text-lg transition-colors", modelPickerOpen ? "text-primary" : selectedModelMeta.color)}>
                                {selectedModelMeta.icon}
                              </span>
                            </Button>
                          </motion.div>
                        </TooltipSimple>
                      }
                      content={
                        <div className="w-[300px] p-1.5 max-h-[300px] overflow-y-auto">
                          {availableModels.map((model) => {
                            const meta = getModelMetadata(model.id);
                            return (
                              <button
                                key={model.id}
                                onClick={() => {
                                  setSelectedModel(model.id);
                                  setModelPickerOpen(false);
                                }}
                                className={cn(
                                  "w-full flex items-start gap-3 p-3 rounded-lg transition-all text-left mb-1 group",
                                  "hover:bg-accent hover:text-accent-foreground",
                                  selectedModel === model.id ? "shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                                style={{
                                  backgroundColor: selectedModel === model.id ? 'color-mix(in srgb, var(--color-primary), transparent 90%)' : undefined
                                }}
                              >
                                <div className="mt-0.5">
                                  <span className={cn(selectedModel === model.id ? "text-primary" : meta.color)}>
                                    {meta.icon}
                                  </span>
                                </div>
                                <div className="flex-1 space-y-1">
                                  <div className={cn(
                                    "font-medium text-sm transition-colors",
                                    selectedModel === model.id ? "text-primary" : "text-foreground"
                                  )}>
                                    {model.display_name}
                                  </div>
                                  <div className={cn(
                                    "text-xs transition-colors",
                                    selectedModel === model.id ? "text-primary/70" : "opacity-70"
                                  )}>
                                    {model.id}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      }
                      open={modelPickerOpen}
                      onOpenChange={setModelPickerOpen}
                      align="start"
                      side="top"
                    />

                    <Popover
                      trigger={
                        <TooltipSimple content={`Thinking: ${selectedThinkingMode}`} side="top">
                          <motion.div whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={disabled}
                              className={cn(
                                "h-9 w-9 p-0 rounded-xl flex items-center justify-center border transition-all duration-200",
                                thinkingModePickerOpen
                                  ? "border-primary/30 shadow-sm"
                                  : "bg-transparent border-transparent hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                              )}
                              style={{
                                backgroundColor: thinkingModePickerOpen
                                  ? 'color-mix(in srgb, var(--color-primary), transparent 85%)'
                                  : undefined
                              }}
                            >
                              <span className={cn(
                                "text-lg transition-colors",
                                thinkingModePickerOpen ? "text-primary" : THINKING_MODES.find(m => m.id === selectedThinkingMode)?.color
                              )}>
                                {THINKING_MODES.find(m => m.id === selectedThinkingMode)?.icon}
                              </span>
                            </Button>
                          </motion.div>
                        </TooltipSimple>
                      }
                      content={
                        <div className="w-[280px] p-1.5">
                          {THINKING_MODES.map((mode) => (
                            <button
                              key={mode.id}
                              onClick={() => {
                                setSelectedThinkingMode(mode.id);
                                setThinkingModePickerOpen(false);
                              }}
                              className={cn(
                                "w-full flex items-start gap-3 p-3 rounded-lg transition-all text-left mb-1 group",
                                "hover:bg-accent hover:text-accent-foreground",
                                selectedThinkingMode === mode.id ? "shadow-sm" : "text-muted-foreground hover:text-foreground"
                              )}
                              style={{
                                backgroundColor: selectedThinkingMode === mode.id ? 'color-mix(in srgb, var(--color-primary), transparent 90%)' : undefined
                              }}
                            >
                              <span className={cn("mt-0.5", selectedThinkingMode === mode.id ? "text-primary" : mode.color)}>
                                {mode.icon}
                              </span>
                              <div className="flex-1 space-y-1">
                                <div className={cn(
                                  "font-medium text-sm transition-colors",
                                  selectedThinkingMode === mode.id ? "text-primary" : "text-foreground"
                                )}>
                                  {mode.name}
                                </div>
                                <div className={cn(
                                  "text-xs transition-colors",
                                  selectedThinkingMode === mode.id ? "text-primary/70" : "opacity-70"
                                )}>
                                  {mode.description}
                                </div>
                              </div>
                              <ThinkingModeIndicator level={mode.level} />
                            </button>
                          ))}
                        </div>
                      }
                      open={thinkingModePickerOpen}
                      onOpenChange={setThinkingModePickerOpen}
                      align="start"
                      side="top"
                    />
                  </div>

                  {/* Textarea Area */}
                  <div className="flex-1 relative pt-1">
                    <Textarea
                      ref={textareaRef}
                      value={prompt}
                      onChange={handleTextChange}
                      onKeyDown={handleKeyDown}
                      onCompositionStart={handleCompositionStart}
                      onCompositionEnd={handleCompositionEnd}
                      onPaste={handlePaste}
                      placeholder={
                        dragActive
                          ? "Drop images here..."
                          : "Message Claude (@ for files, / for commands)..."
                      }
                      disabled={disabled}
                      className={cn(
                        "resize-none pl-1 pr-12 py-1.5 min-h-[44px] transition-all duration-200",
                        "bg-transparent border-none shadow-none focus-visible:ring-0 md:text-sm text-base",
                        "placeholder:text-muted-foreground/50",
                        dragActive && "text-primary",
                        textareaHeight >= 240 && "overflow-y-auto scrollbar-thin"
                      )}
                      style={{
                        height: `${Math.max(textareaHeight - 20, 44)}px`,
                        overflowY: textareaHeight >= 240 ? 'auto' : 'hidden'
                      }}
                    />
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-1">
                    <TooltipSimple content="Expand" side="top">
                      <motion.div whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsExpanded(true)}
                          disabled={disabled}
                          className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-xl bg-transparent border-none transition-all duration-200"
                        >
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    </TooltipSimple>

                    <TooltipSimple content={isLoading ? "Stop" : "Send"} side="top">
                      <motion.div whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={isLoading ? onCancel : handleSend}
                          disabled={isLoading ? false : (!prompt.trim() || disabled)}
                          variant={isLoading ? "destructive" : prompt.trim() ? "default" : "secondary"}
                          size="icon"
                          className={cn(
                            "h-9 w-9 transition-all duration-300 rounded-xl shadow-sm",
                            prompt.trim() && !isLoading ? "bg-primary text-primary-foreground shadow-primary/20" : "text-muted-foreground/60"
                          )}
                        >
                          {isLoading ? (
                            <Square className="h-4 w-4 fill-current" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </motion.div>
                    </TooltipSimple>
                  </div>
                </div>

                {/* Bottom Toolbar */}
                <div
                  className="flex items-center justify-between px-4 py-2 border-t rounded-b-2xl"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--color-muted), transparent 90%)' }}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase opacity-80 flex items-center gap-1.5">
                      {selectedModelData.display_name} • {selectedThinkingMode !== 'auto' ? `THINKING: ${selectedThinkingMode.replace('_', ' ')}` : 'THINKING: AUTO'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {extraMenuItems}
                  </div>
                </div>

                {/* File Picker */}
                <AnimatePresence>
                  {showFilePicker && projectPath && projectPath.trim() && (
                    <FilePicker
                      basePath={projectPath.trim()}
                      onSelect={handleFileSelect}
                      onClose={handleFilePickerClose}
                      initialQuery={filePickerQuery}
                    />
                  )}
                </AnimatePresence>

                {/* Slash Command Picker */}
                <AnimatePresence>
                  {showSlashCommandPicker && (
                    <SlashCommandPicker
                      projectPath={projectPath}
                      onSelect={handleSlashCommandSelect}
                      onClose={handleSlashCommandPickerClose}
                      initialQuery={slashCommandQuery}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </>
    </TooltipProvider>
  );
};

export const FloatingPromptInput = React.forwardRef<
  FloatingPromptInputRef,
  FloatingPromptInputProps
>(FloatingPromptInputInner);

FloatingPromptInput.displayName = 'FloatingPromptInput';
