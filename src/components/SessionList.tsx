import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { ClaudeMemoriesDropdown } from "@/components/ClaudeMemoriesDropdown";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { truncateText, getFirstLine } from "@/lib/date-utils";
import type { Session, ClaudeMdFile } from "@/lib/api";
import { useTheme } from "@/hooks";

interface SessionListProps {
  /**
   * Array of sessions to display
   */
  sessions: Session[];
  /**
   * The current project path being viewed
   */
  projectPath: string;
  /**
   * Optional callback to go back to project list (deprecated - use tabs instead)
   */
  onBack?: () => void;
  /**
   * Callback when a session is clicked
   */
  onSessionClick?: (session: Session) => void;
  /**
   * Callback when a CLAUDE.md file should be edited
   */
  onEditClaudeFile?: (file: ClaudeMdFile) => void;
  /**
   * Optional className for styling
   */
  className?: string;
}

const ITEMS_PER_PAGE = 12;

/**
 * SessionList component - Displays paginated sessions for a specific project
 * 
 * @example
 * <SessionList
 *   sessions={sessions}
 *   projectPath="/Users/example/project"
 *   onBack={() => setSelectedProject(null)}
 *   onSessionClick={(session) => console.log('Selected session:', session)}
 * />
 */
export const SessionList: React.FC<SessionListProps> = ({
  sessions,
  projectPath,
  onSessionClick,
  onEditClaudeFile,
  className,
}) => {
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination
  const totalPages = Math.ceil(sessions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentSessions = sessions.slice(startIndex, endIndex);

  // Reset to page 1 if sessions change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [sessions.length]);

  return (
    <TooltipProvider>
      <div className={cn("space-y-4", className)}>
        {/* CLAUDE.md Memories Dropdown */}
        {onEditClaudeFile && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <ClaudeMemoriesDropdown
              projectPath={projectPath}
              onEditFile={onEditClaudeFile}
            />
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {currentSessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.05,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                <Card
                  className={cn(
                    "p-4 h-full cursor-pointer group relative overflow-hidden transition-all duration-200",
                    "border border-border hover:border-primary/30 bg-card",
                    "hover:shadow-md",
                    session.todo_data && "border-primary/30 bg-primary/5"
                  )}
                  onClick={() => {
                    // Emit a special event for Claude Code session navigation
                    const event = new CustomEvent('claude-session-selected', {
                      detail: { session, projectPath }
                    });
                    window.dispatchEvent(event);
                    onSessionClick?.(session);
                  }}
                >
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      {/* Session header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className={cn(
                            "p-1.5 rounded-md shrink-0 transition-colors",
                            session.todo_data ? "bg-primary/20 text-primary" : ((theme === 'dark' || theme === 'gray') ? "bg-muted text-muted-foreground" : "bg-[#f4f4f5] text-muted-foreground") + " group-hover:bg-primary/10 group-hover:text-primary"
                          )}>
                            <Clock className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium tracking-tight text-foreground/90 group-hover:text-primary transition-colors">
                              {session.message_timestamp
                                ? new Date(session.message_timestamp).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: 'numeric'
                                })
                                : new Date(session.created_at * 1000).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              }
                            </p>
                          </div>
                        </div>
                        {session.todo_data && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary uppercase tracking-wider border border-primary/20">
                            Todo
                          </span>
                        )}
                      </div>

                      {/* First message preview */}
                      {session.first_message ? (
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                          {truncateText(getFirstLine(session.first_message), 140)}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground/50 italic">
                          No messages yet
                        </p>
                      )}
                    </div>

                    {/* Metadata footer */}
                    <div className="flex items-center justify-between pt-3 mt-1 border-t border-border/10">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-mono">
                          {session.id.slice(-8)}
                        </p>
                      </div>
                      {session.todo_data && (
                        <MessageSquare className="h-3 w-3 text-primary/70" />
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div >
    </TooltipProvider >
  );
}; 