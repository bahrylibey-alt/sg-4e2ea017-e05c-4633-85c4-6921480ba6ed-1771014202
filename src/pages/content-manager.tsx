import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Edit, 
  Trash2, 
  Check, 
  Calendar,
  Filter,
  RefreshCw,
  Download,
  Search
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";

interface GeneratedContent {
  id: string;
  user_id: string;
  campaign_id: string | null;
  title: string;
  body: string;
  description: string | null;
  type: string;
  category: string | null;
  status: string;
  views: number;
  clicks: number;
  created_at: string;
  updated_at: string;
}

export default function ContentManager() {
  const { toast } = useToast();
  const [content, setContent] = useState<GeneratedContent[]>([]);
  const [filteredContent, setFilteredContent] = useState<GeneratedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingContent, setEditingContent] = useState<GeneratedContent | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadContent();
  }, []);

  useEffect(() => {
    filterContent();
  }, [content, statusFilter, typeFilter, searchQuery]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Please sign in", variant: "destructive" });
        return;
      }

      const { data, error } = await supabase
        .from('generated_content')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setContent(data || []);
      toast({ title: "✅ Content Loaded", description: `Found ${data?.length || 0} content pieces` });
    } catch (error: any) {
      console.error('Error loading content:', error);
      toast({ title: "Error loading content", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filterContent = () => {
    let filtered = [...content];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(c => c.type === typeFilter);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.body.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredContent(filtered);
  };

  const handleEdit = (item: GeneratedContent) => {
    setEditingContent(item);
    setEditedTitle(item.title);
    setEditedBody(item.body);
  };

  const handleSaveEdit = async () => {
    if (!editingContent) return;

    try {
      const { error } = await supabase
        .from('generated_content')
        .update({
          title: editedTitle,
          body: editedBody,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingContent.id);

      if (error) throw error;

      toast({ title: "✅ Content Updated", description: "Changes saved successfully" });
      setEditingContent(null);
      loadContent();
    } catch (error: any) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this content?")) return;

    try {
      const { error } = await supabase
        .from('generated_content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "✅ Content Deleted" });
      loadContent();
    } catch (error: any) {
      toast({ title: "Error deleting", description: error.message, variant: "destructive" });
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('generated_content')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast({ title: `✅ Status Updated to ${newStatus}` });
      loadContent();
    } catch (error: any) {
      toast({ title: "Error updating status", description: error.message, variant: "destructive" });
    }
  };

  const exportToCSV = () => {
    const csv = [
      ['ID', 'Type', 'Category', 'Status', 'Title', 'Body Preview', 'Created At'],
      ...filteredContent.map(c => [
        c.id,
        c.type,
        c.category || 'N/A',
        c.status,
        `"${c.title.replace(/"/g, '""')}"`,
        `"${c.body.substring(0, 50).replace(/"/g, '""')}..."`,
        new Date(c.created_at).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast({ title: "✅ Exported", description: `${filteredContent.length} items exported` });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <SEO title="Content Manager - AffiliatePro" />
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Content Manager
            </h1>
            <p className="text-muted-foreground">Review, edit, and manage AI-generated content</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadContent} variant="outline" size="sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="Search content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="best-under-price">Best Under Price</SelectItem>
                    <SelectItem value="comparison">Comparison</SelectItem>
                    <SelectItem value="guide">Guide</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={() => {
                    setStatusFilter("all");
                    setTypeFilter("all");
                    setSearchQuery("");
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredContent.length} of {content.length} content pieces
            </div>
          </CardContent>
        </Card>

        {/* Content Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Content Preview</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Generated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                        <p className="text-muted-foreground">Loading content...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredContent.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <p className="text-muted-foreground">No content found. Try adjusting your filters.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredContent.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">{item.id.substring(0, 8)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.type}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs font-medium truncate">
                          {item.title}
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="text-sm truncate text-muted-foreground">{item.body}</p>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.status}
                            onValueChange={(value) => handleStatusChange(item.id, value)}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="published">Published</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                  <DialogTitle>Edit Content</DialogTitle>
                                  <DialogDescription>
                                    Make changes to your AI-generated content
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">Title</label>
                                    <Input
                                      value={editedTitle}
                                      onChange={(e) => setEditedTitle(e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">Content Text</label>
                                    <Textarea
                                      value={editedBody}
                                      onChange={(e) => setEditedBody(e.target.value)}
                                      rows={12}
                                      className="resize-none"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {editedBody.length} characters
                                    </p>
                                  </div>
                                  <div className="flex justify-end gap-2 pt-4">
                                    <Button variant="outline" onClick={() => setEditingContent(null)}>
                                      Cancel
                                    </Button>
                                    <Button onClick={handleSaveEdit}>
                                      <Check className="w-4 h-4 mr-2" />
                                      Save Changes
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}