import React, { useState, useEffect } from 'react';
import { FileText, Globe, Layers, Layout, Code2, FolderTree } from 'lucide-react';
import { cn } from "@/lib/utils";
import { WebviewPreview } from './WebviewPreview';

interface WorkspacePanelProps {
    projectPath: string | null;
    previewUrl: string;
    onPreviewClose: () => void;
    isPreviewMaximized: boolean;
    onTogglePreviewMaximize: () => void;
    onPreviewUrlChange: (url: string) => void;
    className?: string;
}

type TabType = 'files' | 'preview' | 'changes';

export const WorkspacePanel: React.FC<WorkspacePanelProps> = ({
    projectPath,
    previewUrl,
    onPreviewClose,
    isPreviewMaximized,
    onTogglePreviewMaximize,
    onPreviewUrlChange,
    className
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('files');

    // If previewUrl is set and we were not in preview, maybe switch?
    // But usually we want user control. However, if first time opening, maybe useful.
    // For now let's keep it simple.

    // If previewUrl is updated externally, we might want to switch to preview tab automatically
    useEffect(() => {
        if (previewUrl && previewUrl !== 'about:blank') {
            setActiveTab('preview');
        }
    }, [previewUrl]);

    return (
        <div className={cn("flex flex-col h-full bg-background border-l", className)}>
            {/* Tabs Header */}
            <div className="flex items-center border-b bg-muted/20 px-2 pt-2 gap-1 shrink-0">
                <button
                    onClick={() => setActiveTab('files')}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md border-t border-x border-transparent transition-all select-none",
                        activeTab === 'files'
                            ? "bg-background border-border text-foreground shadow-sm -mb-px relative z-10"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                >
                    <FolderTree className="h-4 w-4" />
                    Project Files
                </button>
                <button
                    onClick={() => setActiveTab('preview')}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md border-t border-x border-transparent transition-all select-none",
                        activeTab === 'preview'
                            ? "bg-background border-border text-foreground shadow-sm -mb-px relative z-10"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                >
                    <Globe className="h-4 w-4" />
                    Browser Preview
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative bg-background">
                {activeTab === 'files' && (
                    <div className="flex flex-col h-full">
                        <div className="p-8 flex flex-col items-center justify-center h-full text-muted-foreground/50 border-t border-transparent">
                            <FolderTree className="h-16 w-16 mb-4 opacity-10" />
                            <p className="font-medium text-lg text-foreground/20">Project Workspace</p>
                            <p className="text-xs mt-4 font-mono bg-muted/30 px-3 py-1.5 rounded border border-border/20">
                                {projectPath || 'No project selected'}
                            </p>
                        </div>
                    </div>
                )}

                {/* We keep Webview mounted but hidden if not active to preserve state if needed, 
            or unmount to save resources. WebviewPreview uses iframe, so state loss is expected on unmount.
            But for now, unmounting is safer for resource usage.
        */}
                {activeTab === 'preview' && (
                    <WebviewPreview
                        initialUrl={previewUrl}
                        onClose={onPreviewClose}
                        isMaximized={isPreviewMaximized}
                        onToggleMaximize={onTogglePreviewMaximize}
                        onUrlChange={onPreviewUrlChange}
                        className="border-none h-full"
                    />
                )}
            </div>
        </div>
    );
};
