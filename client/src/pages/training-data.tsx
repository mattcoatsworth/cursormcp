import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, Plus, RefreshCw, Filter, ChevronDown, ChevronUp, ListFilter } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type TrainingDataItem = {
  id: string;
  tool: string;
  intent: string;
  query: string;
  response: string;
  metadata: Record<string, any> & {
    is_multi_service?: boolean;
    services_required?: string[];
    scenario?: string;
    description?: string;
    complexity?: string;
  };
  createdAt: string;
  updatedAt: string;
};

type TrainingMetadata = {
  tools: string[];
  intents: Record<string, string[]>;
  totalExamples: number;
};

export default function TrainingDataPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTool, setSelectedTool] = useState<string | null>('all-tools');
  const [selectedIntent, setSelectedIntent] = useState<string | null>('all-intents');
  const [showMultiServiceOnly, setShowMultiServiceOnly] = useState<boolean>(false);
  const [newEntry, setNewEntry] = useState({
    tool: "",
    intent: "",
    query: "",
    response: "",
    metadata: {},
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch training data entries
  const {
    data: trainingData,
    isLoading,
    error,
    refetch,
  } = useQuery<TrainingDataItem[]>({
    queryKey: [
      "/api/training",
      selectedTool,
      selectedIntent,
      searchQuery ? "search" : null,
      searchQuery,
      showMultiServiceOnly ? "multi-service" : null,
    ],
    retry: 3,
    retryDelay: 1000,
    queryFn: async () => {
      console.log("Fetching training data with filters:", {
        tool: selectedTool,
        intent: selectedIntent,
        searchQuery,
        showMultiServiceOnly,
      });
      
      // If we want multi-service examples only, use the dedicated endpoint
      if (showMultiServiceOnly) {
        return await apiRequest<TrainingDataItem[]>(
          "/api/training/multi-service",
          "GET"
        );
      }
      
      // Handle search query
      if (searchQuery && searchQuery.trim().length > 0) {
        return await apiRequest<TrainingDataItem[]>(
          `/api/training/search?q=${encodeURIComponent(searchQuery)}`,
          "GET"
        );
      }
      
      // Regular filtering
      let url = "/api/training";
      const params = new URLSearchParams();
      
      // Only add the tool parameter if it's not 'all-tools'
      if (selectedTool && selectedTool !== 'all-tools') {
        params.append("tool", selectedTool);
      }
      
      // Only add the intent parameter if it's not 'all-intents'
      if (selectedIntent && selectedIntent !== 'all-intents') {
        params.append("intent", selectedIntent);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      return await apiRequest<TrainingDataItem[]>(url, "GET");
    },
  });

  // Fetch metadata (available tools and intents)
  const { data: metadata, isLoading: isLoadingMetadata } = useQuery<TrainingMetadata>({
    queryKey: ["/api/training/metadata"],
    queryFn: async () => {
      return await apiRequest<TrainingMetadata>("/api/training/metadata", "GET");
    },
  });

  // When tool selection changes, reset intent selection
  useEffect(() => {
    setSelectedIntent('all-intents');
  }, [selectedTool]);
  
  // When multi-service toggle changes, reset other filters
  useEffect(() => {
    if (showMultiServiceOnly) {
      setSelectedTool('all-tools');
      setSelectedIntent('all-intents');
      setSearchQuery('');
    }
  }, [showMultiServiceOnly]);

  const handleAddEntry = async () => {
    try {
      if (!newEntry.tool || !newEntry.intent || !newEntry.query || !newEntry.response) {
        toast({
          title: "Missing fields",
          description: "All fields are required",
          variant: "destructive",
        });
        return;
      }

      await apiRequest<TrainingDataItem>("/api/training", "POST", {
        ...newEntry,
        metadata: { source: "manual", added_date: new Date().toISOString() },
      });

      toast({
        title: "Success",
        description: "Training data entry added successfully",
      });
      setNewEntry({
        tool: "",
        intent: "",
        query: "",
        response: "",
        metadata: {},
      });
      setIsDialogOpen(false);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to add training data: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      refetch();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Training Data Management</h1>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Training Data Entry</DialogTitle>
                <DialogDescription>
                  Create a new training data example for the AI model.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="tool">Tool</label>
                    <Select
                      onValueChange={(value) => setNewEntry({ ...newEntry, tool: value })}
                      value={newEntry.tool}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tool" />
                      </SelectTrigger>
                      <SelectContent>
                        {(metadata?.tools || []).map((tool) => (
                          <SelectItem key={tool} value={tool}>
                            {tool}
                          </SelectItem>
                        ))}
                        <SelectItem value="Custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="intent">Intent</label>
                    {newEntry.tool && newEntry.tool !== "Custom" && metadata?.intents[newEntry.tool] ? (
                      <Select
                        onValueChange={(value) => setNewEntry({ ...newEntry, intent: value })}
                        value={newEntry.intent}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select intent" />
                        </SelectTrigger>
                        <SelectContent>
                          {(metadata?.intents?.[newEntry.tool] || []).map((intent) => (
                            <SelectItem key={intent} value={intent}>
                              {intent}
                            </SelectItem>
                          ))}
                          <SelectItem value="Custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder="Enter intent"
                        value={newEntry.intent}
                        onChange={(e) => setNewEntry({ ...newEntry, intent: e.target.value })}
                      />
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="query">Query</label>
                  <Textarea
                    placeholder="Enter user query"
                    value={newEntry.query}
                    onChange={(e) => setNewEntry({ ...newEntry, query: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="response">Response</label>
                  <Textarea
                    placeholder="Enter system response"
                    value={newEntry.response}
                    onChange={(e) => setNewEntry({ ...newEntry, response: e.target.value })}
                    rows={5}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddEntry}>Add Entry</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 flex">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search training data..."
              className="pl-10 rounded-r-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              disabled={showMultiServiceOnly}
            />
          </div>
          <Button 
            className="rounded-l-none" 
            onClick={() => refetch()}
            disabled={showMultiServiceOnly}
          >
            Search
          </Button>
        </div>
        <div className="flex gap-2">
          <Select
            value={selectedTool || ""}
            onValueChange={(value) => setSelectedTool(value || null)}
            disabled={showMultiServiceOnly}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Tools" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-tools">All Tools</SelectItem>
              {(metadata?.tools || []).map((tool) => (
                <SelectItem key={tool} value={tool}>
                  {tool}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedIntent || ""}
            onValueChange={(value) => setSelectedIntent(value || null)}
            disabled={!selectedTool || showMultiServiceOnly}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Intents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-intents">All Intents</SelectItem>
              {selectedTool &&
                (metadata?.intents?.[selectedTool] || []).map((intent) => (
                  <SelectItem key={intent} value={intent}>
                    {intent}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Switch
              id="multi-service"
              checked={showMultiServiceOnly}
              onCheckedChange={setShowMultiServiceOnly}
            />
            <Label htmlFor="multi-service" className="cursor-pointer text-sm">
              Multi-Service Only
            </Label>
          </div>
        </div>
      </div>

      {isLoading || isLoadingMetadata ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded">
          <p>An error occurred while loading training data.</p>
          <p className="mt-2 text-sm">{error instanceof Error ? error.message : String(error)}</p>
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            size="sm" 
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      ) : trainingData && trainingData.length > 0 ? (
        <div>
          <Tabs defaultValue="card-view" className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="card-view">Card View</TabsTrigger>
                <TabsTrigger value="table-view">Table View</TabsTrigger>
              </TabsList>
              <div className="text-sm text-muted-foreground">
                Showing {trainingData.length} of {metadata?.totalExamples || "many"} training examples
              </div>
            </div>
            
            <TabsContent value="card-view">
              <div className="grid grid-cols-1 gap-6">
                <Accordion type="multiple" className="w-full">
                  {trainingData.slice(0, 50).map((item, index) => (
                    <AccordionItem key={item.id} value={item.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex flex-1 items-center">
                          <div className="mr-4 flex h-7 w-7 items-center justify-center rounded-full border">
                            {index + 1}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="font-medium line-clamp-1">{item.query}</div>
                          </div>
                          <div className="ml-4 flex space-x-2">
                            {item.metadata?.is_multi_service ? (
                              <Badge variant="destructive" className="capitalize">
                                Multi-Service
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="capitalize">
                                {item.tool}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="capitalize">
                              {item.intent}
                            </Badge>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium">Query</CardTitle>
                              {item.metadata?.is_multi_service && item.metadata?.scenario && (
                                <CardDescription>
                                  Scenario: {item.metadata.scenario}
                                </CardDescription>
                              )}
                            </CardHeader>
                            <CardContent>
                              <div className="text-sm whitespace-pre-wrap">
                                {item.query}
                              </div>
                              
                              {item.metadata?.is_multi_service && item.metadata?.services_required && (
                                <div className="mt-3 pt-3 border-t border-border">
                                  <p className="text-xs font-semibold mb-1">Required Services:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {item.metadata.services_required.map((service: string) => (
                                      <Badge key={service} variant="outline" className="text-xs">
                                        {service}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                            <CardFooter className="pt-0 text-xs text-muted-foreground">
                              Added on {new Date(item.createdAt).toLocaleDateString()}
                            </CardFooter>
                          </Card>
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium">Response</CardTitle>
                              {item.metadata?.is_multi_service && item.metadata?.description && (
                                <CardDescription>
                                  {item.metadata.description}
                                </CardDescription>
                              )}
                            </CardHeader>
                            <CardContent>
                              <div className="text-sm whitespace-pre-wrap">
                                {item.response}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </TabsContent>
            
            <TabsContent value="table-view">
              <div className="overflow-x-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">#</TableHead>
                      <TableHead className="w-[100px]">Tool</TableHead>
                      <TableHead className="w-[150px]">Intent</TableHead>
                      <TableHead className="w-1/3">Query</TableHead>
                      <TableHead className="w-1/3">Response</TableHead>
                      <TableHead className="w-[120px]">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trainingData.slice(0, 50).map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {item.metadata?.is_multi_service ? (
                            <Badge variant="destructive">Multi-Service</Badge>
                          ) : (
                            item.tool
                          )}
                        </TableCell>
                        <TableCell>
                          {item.metadata?.is_multi_service && item.metadata?.scenario ? (
                            <span title={item.metadata.description || ""}>{item.metadata.scenario}</span>
                          ) : (
                            item.intent
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate">{item.query}</div>
                        </TableCell>
                        <TableCell className="max-w-sm">
                          <div className="truncate">
                            {item.response.substring(0, 100)}
                            {item.response.length > 100 ? "..." : ""}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="p-8 border rounded-lg flex flex-col items-center justify-center text-center">
          <div className="mb-4 p-4 bg-muted rounded-full">
            <Filter className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">No Training Data Found</h3>
          <p className="text-muted-foreground">
            {searchQuery || (selectedTool && selectedTool !== 'all-tools') || (selectedIntent && selectedIntent !== 'all-intents') || showMultiServiceOnly
              ? "Try changing your filters or search query. If using Multi-Service Only filter, ensure you have cross-service training data."
              : "Add your first training data entry using the button above"}
          </p>
          
          {/* Debugging information */}
          <div className="mt-6 p-4 border border-red-200 bg-red-50 rounded-md text-left text-sm">
            <h4 className="font-semibold">Debugging Information:</h4>
            <p className="mb-2">Try searching for common terms like "Shopify", "Order", "Email", or "Campaign"</p>
            <div className="text-xs text-slate-700 mt-2">
              <div>API Response: {trainingData ? `Received ${trainingData.length} records` : 'No data received'}</div>
              <div>isLoading: {isLoading ? 'true' : 'false'}, hasError: {error ? 'true' : 'false'}</div>
              <div>Current Query: {searchQuery || '[empty]'}, Selected Tool: {selectedTool}, Selected Intent: {selectedIntent}</div>
              <div>Multi-Service Only: {showMultiServiceOnly ? 'Yes' : 'No'}</div>
              {error && <div className="text-red-600 mt-1">Error: {error.toString()}</div>}
              
              {/* Raw data display */}
              {trainingData && trainingData.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-medium mb-2">Raw Data (First 3 entries):</h5>
                  <div className="overflow-auto max-h-60 border border-gray-200 p-2 rounded bg-white">
                    {trainingData.slice(0, 3).map((item, idx) => (
                      <div key={item.id} className="mb-3 pb-3 border-b border-gray-100">
                        <div><strong>#{idx+1}. {item.tool}</strong> / {item.intent}</div>
                        <div className="truncate"><strong>Query:</strong> {item.query}</div>
                        <div className="truncate"><strong>Response:</strong> {item.response?.substring(0, 100)}...</div>
                      </div>
                    ))}
                    
                    {trainingData.length > 3 && (
                      <div className="text-center text-gray-500 pt-1">
                        + {trainingData.length - 3} more entries
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}