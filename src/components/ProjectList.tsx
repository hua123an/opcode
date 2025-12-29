import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FolderOpen,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Project } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ProjectListProps {
  /**
   * Array of projects to display
   */
  projects: Project[];
  /**
   * Callback when a project is clicked
   */
  onProjectClick: (project: Project) => void;
  /**
   * Callback when open project is clicked
   */
  onOpenProject?: () => void | Promise<void>;
  /**
   * Whether the list is currently loading
   */
  loading?: boolean;
  /**
   * Optional className for styling
   */
  className?: string;
}

/**
 * Extracts the project name from the full path
 */
const getProjectName = (path: string): string => {
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1] || path;
};

/**
 * Formats path to be more readable - shows full path relative to home
 * Truncates long paths with ellipsis in the middle
 */
const getDisplayPath = (path: string, maxLength: number = 30): string => {
  // Try to make path home-relative
  let displayPath = path;
  const homeIndicators = ['/Users/', '/home/'];
  for (const indicator of homeIndicators) {
    if (path.includes(indicator)) {
      const parts = path.split('/');
      const userIndex = parts.findIndex((_part, i) =>
        i > 0 && parts[i - 1] === indicator.split('/')[1]
      );
      if (userIndex > 0) {
        const relativePath = parts.slice(userIndex + 1).join('/');
        displayPath = `~/${relativePath}`;
        break;
      }
    }
  }

  // Truncate if too long
  if (displayPath.length > maxLength) {
    const start = displayPath.substring(0, Math.floor(maxLength / 2) - 2);
    const end = displayPath.substring(displayPath.length - Math.floor(maxLength / 2) + 2);
    return `${start}...${end}`;
  }

  return displayPath;
};

/**
 * ProjectList component - Displays recent projects in a Cursor-like interface
 * 
 * @example
 * <ProjectList
 *   projects={projects}
 *   onProjectClick={(project) => console.log('Selected:', project)}
 *   onOpenProject={() => console.log('Open project')}
 * />
 */
export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  onProjectClick,
  onOpenProject,
  className,
}) => {
  const [showAll, setShowAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Determine how many projects to show
  const projectsPerPage = showAll ? 10 : 5;
  const totalPages = Math.ceil(projects.length / projectsPerPage);

  // Calculate which projects to display
  const startIndex = showAll ? (currentPage - 1) * projectsPerPage : 0;
  const endIndex = startIndex + projectsPerPage;
  const displayedProjects = projects.slice(startIndex, endIndex);

  const handleViewAll = () => {
    setShowAll(true);
    setCurrentPage(1);
  };

  const handleViewLess = () => {
    setShowAll(false);
    setCurrentPage(1);
  };

  return (
    <div className={cn("h-full overflow-y-auto", className)}>
      <div className="max-w-6xl mx-auto flex flex-col h-full">
        {/* Header */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Projects</h1>
              <p className="mt-1 text-body-small text-muted-foreground">
                Select a project to start working with Claude Code
              </p>
            </div>
            <motion.div
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                onClick={onOpenProject}
                size="default"
                className="flex items-center gap-2"
              >
                <FolderOpen className="h-4 w-4" />
                Open Project
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Recent projects section */}
          {displayedProjects.length > 0 ? (
            <Card className="p-0 border border-border bg-card shadow-sm rounded-xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold tracking-tight">Recent Projects</h2>
                  {!showAll ? (
                    <button
                      onClick={handleViewAll}
                      className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-md hover:bg-primary/10"
                    >
                      View all ({projects.length})
                    </button>
                  ) : (
                    <button
                      onClick={handleViewLess}
                      className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-md hover:bg-primary/10"
                    >
                      View less
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {displayedProjects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.2,
                        delay: index * 0.03,
                      }}
                      className="group"
                    >
                      <motion.button
                        onClick={() => onProjectClick(project)}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.1 }}
                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-accent/40 transition-all border border-transparent hover:border-border/30 flex items-center justify-between group-hover:shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-md bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-200">
                            <FolderOpen className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="block text-sm font-semibold text-foreground/90 group-hover:text-primary transition-colors">
                              {getProjectName(project.path)}
                            </span>
                            <span className="block text-xs text-muted-foreground font-mono mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                              {getDisplayPath(project.path, 45)}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary/50 group-hover:translate-x-0.5 transition-all" />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>

                {/* Pagination controls */}
                {showAll && totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-8 pt-4 border-t border-border/10">
                    <motion.div
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </motion.div>

                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={cn(
                            "w-8 h-8 p-0 rounded-full text-xs",
                            currentPage === page ? "shadow-md" : "text-muted-foreground"
                          )}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>

                    <motion.div
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center -mt-10">
              <div className="rounded-2xl p-12 max-w-lg w-full text-center border border-border bg-card shadow-lg">
                <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto ring-4 ring-primary/5">
                  <FolderOpen className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3 tracking-tight">No recent projects</h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Select a project folder to start working with Claude Code. Your recent projects will appear here.
                </p>
                <div className="flex justify-center">
                  <motion.div
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Button
                      onClick={onOpenProject}
                      size="lg"
                      className="flex items-center gap-2 shadow-lg hover:shadow-primary/20 transition-all px-8 rounded-full"
                    >
                      <FolderOpen className="h-4 w-4" />
                      Open Your First Project
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 
