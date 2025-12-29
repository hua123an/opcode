import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toast, ToastContainer } from "@/components/ui/toast";
import { api, type MCPServer } from "@/lib/api";
import { MCPServerList } from "./MCPServerList";
import { MCPAddServer } from "./MCPAddServer";
import { MCPImportExport } from "./MCPImportExport";
import { Github, Download, Terminal, Check, Copy } from "lucide-react";
import { OFFICIAL_PLUGINS, COMMUNITY_SKILLS } from "@/data/community_skills";

interface MCPManagerProps {
  /**
   * Callback to go back to the main view
   */
  onBack: () => void;
  /**
   * Optional className for styling
   */
  className?: string;
}

/**
 * Main component for managing MCP (Model Context Protocol) servers
 * Provides a comprehensive UI for adding, configuring, and managing MCP servers
 */
export const MCPManager: React.FC<MCPManagerProps> = ({
  className: _className,
}) => {
  const [activeTab, setActiveTab] = useState("servers");
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [installingPlugin, setInstallingPlugin] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleInstallPlugin = async (name: string) => {
    try {
      setInstallingPlugin(name);
      await api.pluginInstall(name);
      setToast({ message: `Plugin ${name} installed successfully!`, type: "success" });
    } catch (err) {
      setToast({ message: `Failed to install plugin ${name}: ${err}`, type: "error" });
    } finally {
      setInstallingPlugin(null);
    }
  };

  const handleInstallSkill = async (skill: typeof COMMUNITY_SKILLS[0]) => {
    if (!skill.installCommand) return;
    try {
      setInstallingPlugin(skill.id);
      // mcpAdd signature: (name, transport, command, args, env, url, scope)
      await api.mcpAdd(skill.id, 'stdio', skill.installCommand, skill.args || [], {}, undefined, 'project');
      setToast({ message: `Skill ${skill.name} installed successfully!`, type: "success" });
      loadServers();
    } catch (err) {
      setToast({ message: `Failed to install skill ${skill.name}: ${err}`, type: "error" });
    } finally {
      setInstallingPlugin(null);
    }
  };

  const handleCopyCommand = (cmd: string, id: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    setToast({ message: "Command copied to clipboard!", type: "success" });
  };


  // Load servers on mount
  useEffect(() => {
    loadServers();
  }, []);

  /**
   * Loads all MCP servers
   */
  const loadServers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("MCPManager: Loading servers...");
      const serverList = await api.mcpList();
      console.log("MCPManager: Received server list:", serverList);
      console.log("MCPManager: Server count:", serverList.length);
      setServers(serverList);
    } catch (err) {
      console.error("MCPManager: Failed to load MCP servers:", err);
      setError("Failed to load MCP servers. Make sure Claude Code is installed.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles server added event
   */
  const handleServerAdded = () => {
    loadServers();
    setToast({ message: "MCP server added successfully!", type: "success" });
    setActiveTab("servers");
  };

  /**
   * Handles server removed event
   */
  const handleServerRemoved = (name: string) => {
    setServers(prev => prev.filter(s => s.name !== name));
    setToast({ message: `Server "${name}" removed successfully!`, type: "success" });
  };

  /**
   * Handles import completed event
   */
  const handleImportCompleted = (imported: number, failed: number) => {
    loadServers();
    if (failed === 0) {
      setToast({
        message: `Successfully imported ${imported} server${imported > 1 ? 's' : ''}!`,
        type: "success"
      });
    } else {
      setToast({
        message: `Imported ${imported} server${imported > 1 ? 's' : ''}, ${failed} failed`,
        type: "error"
      });
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto flex flex-col h-full">
        {/* Header */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-heading-1">MCP Servers</h1>
              <p className="mt-1 text-body-small text-muted-foreground">
                Manage Model Context Protocol servers
              </p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-6 mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/50 flex items-center gap-2 text-body-small text-destructive"
            >
              <AlertCircle className="h-4 w-4" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 w-full max-w-xl mb-6 h-auto p-1">
                <TabsTrigger value="servers" className="py-2.5 px-3">
                  Servers
                </TabsTrigger>
                <TabsTrigger value="add" className="py-2.5 px-3">
                  Add Server
                </TabsTrigger>
                <TabsTrigger value="import" className="py-2.5 px-3">
                  Import/Export
                </TabsTrigger>
                <TabsTrigger value="community" className="py-2.5 px-3">
                  Community
                </TabsTrigger>
              </TabsList>

              {/* Servers Tab */}
              <TabsContent value="servers" className="space-y-6 mt-6">
                <Card>
                  <MCPServerList
                    servers={servers}
                    loading={false}
                    onServerRemoved={handleServerRemoved}
                    onRefresh={loadServers}
                  />
                </Card>
              </TabsContent>

              {/* Add Server Tab */}
              <TabsContent value="add" className="space-y-6 mt-6">
                <Card>
                  <MCPAddServer
                    onServerAdded={handleServerAdded}
                    onError={(message: string) => setToast({ message, type: "error" })}
                  />
                </Card>
              </TabsContent>

              {/* Import/Export Tab */}
              <TabsContent value="import" className="space-y-6 mt-6">
                <Card className="overflow-hidden">
                  <MCPImportExport
                    onImportCompleted={handleImportCompleted}
                    onError={(message: string) => setToast({ message, type: "error" })}
                  />
                </Card>
              </TabsContent>

              {/* Community Tab */}
              <TabsContent value="community" className="space-y-6 mt-6">
                <Card className="p-6">
                  {/* Official Plugins Section */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Terminal className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">Official Plugins (LSP)</h3>
                      <p className="text-sm text-muted-foreground">Certified language plugins. <strong>Requires local tools installed.</strong></p>
                    </div>
                  </div>

                  <div className="grid gap-4 mb-8">
                    {OFFICIAL_PLUGINS.map((plugin) => (
                      <div key={plugin.id} className="p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm">{plugin.name}</h4>
                              <span className="text-xs bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded">Anthropic</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{plugin.description}</p>
                          </div>
                        </div>

                        {plugin.setupCommand && (
                          <div className="mb-3">
                            <div className="text-[10px] text-muted-foreground mb-1">Prerequisite Command:</div>
                            <div className="flex items-center gap-2">
                              <code className="text-[10px] font-mono bg-background px-2 py-1 rounded border flex-1 overflow-hidden text-ellipsis whitespace-nowrap select-all">{plugin.setupCommand}</code>
                              <button
                                onClick={() => handleCopyCommand(plugin.setupCommand!, plugin.id + '_setup')}
                                className="p-1.5 hover:bg-background rounded-md transition-colors border"
                                title="Copy Setup Command"
                              >
                                {copiedId === plugin.id + '_setup' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                              </button>
                            </div>
                          </div>
                        )}

                        <Button
                          variant="secondary" // Changed to secondary to de-emphasize until setup done? Or Primary?
                          size="sm"
                          className="w-full"
                          onClick={() => handleInstallPlugin(plugin.id)}
                          disabled={loading || installingPlugin === plugin.id}
                        >
                          {installingPlugin === plugin.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
                          Enable Plugin (claude plugin install)
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Community Skills Section */}
                  <div className="flex items-center gap-3 mb-6 pt-4 border-t border-border">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Github className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">Recommended Skills</h3>
                      <p className="text-sm text-muted-foreground">Certified MCP servers. One-click install for standard tools.</p>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {COMMUNITY_SKILLS.map((skill) => {
                      const requiresEnv = skill.env_vars && skill.env_vars.length > 0;
                      return (
                        <div key={skill.id} className="p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm">{skill.name}</h4>
                                <span className="text-xs bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{skill.author}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{skill.description}</p>
                            </div>

                            {!requiresEnv ? (
                              <button
                                onClick={() => handleInstallSkill(skill)}
                                disabled={installingPlugin === skill.id}
                                className="ml-4 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50"
                              >
                                {installingPlugin === skill.id ? (
                                  <>Installing...</>
                                ) : (
                                  <>
                                    <Download className="h-3 w-3" />
                                    Install
                                  </>
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleCopyCommand(`claude mcp add ${skill.id} ${skill.installCommand} ${skill.args?.join(' ')}`, skill.id)}
                                className="ml-4 px-3 py-1.5 bg-secondary text-secondary-foreground text-xs font-medium rounded-md hover:bg-secondary/80 flex items-center gap-2"
                              >
                                {copiedId === skill.id ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                                Copy
                              </button>
                            )}
                          </div>

                          {requiresEnv && (
                            <div className="mt-3 text-[10px] text-amber-500 flex items-center gap-1">
                              <span>⚠️ Requires Environment Variables: {skill.env_vars?.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      <ToastContainer>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onDismiss={() => setToast(null)}
          />
        )}
      </ToastContainer>
    </div>
  );
}; 