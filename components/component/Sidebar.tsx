'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';
import { Button } from "@/components/ui/button";
import { Settings, Share2, Trash2, ChevronRight, MoreVertical, Plus, BookOpen, Library, ChevronDown, Sun, Moon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from 'react-hot-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import ShareModal from './ShareModal';
import ShareButton from './ShareButton';
import { Input } from "@/components/ui/input";
import ShareNotebookModal from './ShareNotebookModal';
import ShareChapterModal from './ShareChapterModal';

interface Chapter {
  _id: string;
  title: string;
  notebookId: string;
}

interface Notebook {
  _id: string;
  title: string;
  chapters: Chapter[];
}

interface EnrolledQuestionBank {
  _id: string;
  bankTitle: string;
  bankUrl: string;
  isEditor: boolean;
  isCreator: boolean;
}

interface SidebarProps {
  isPremium: boolean;
  onDeleteChapter: (notebookId: string, chapterId: string) => Promise<void>;
  onShareChapter: (notebookId: string, chapterId: string) => void;
  onOpenNotebookCreation: () => void;
  onSelectNotebook: (notebookId: string) => void;
  selectedNotebookId: string | undefined;
  notebooks: Notebook[];
  onDeleteNotebook: (notebookId: string) => Promise<void>;
  onShareNotebook: (notebookId: string) => Promise<void>;
  onChapterClick: (notebookId: string, chapterId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isPremium, onDeleteChapter, onShareChapter, onOpenNotebookCreation, onSelectNotebook, selectedNotebookId, notebooks, onDeleteNotebook, onShareNotebook, onChapterClick }) => {
  const [enrolledQuestionBanks, setEnrolledQuestionBanks] = useState<EnrolledQuestionBank[]>([]);
  const { user, isAuthenticated } = useAuth();
  const [plan, setPlan] = useState<'free' | 'premium'>('free');
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [expandedNotebooks, setExpandedNotebooks] = useState<Record<string, boolean>>({});
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const router = useRouter();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedChapterForShare, setSelectedChapterForShare] = useState<string | null>(null);
  const [isNewNotebookDialogOpen, setIsNewNotebookDialogOpen] = useState(false);
  const [newNotebookTitle, setNewNotebookTitle] = useState('');
  const [isShareNotebookModalOpen, setIsShareNotebookModalOpen] = useState(false);
  const [selectedNotebookForShare, setSelectedNotebookForShare] = useState<string | null>(null);
  const [hoveredTitle, setHoveredTitle] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotebooksAndChapters = async () => {
      const apiUrl = process.env.NODE_ENV === 'production'
        ? process.env.NEXT_PUBLIC_API_URL_PRODUCTION
        : process.env.NEXT_PUBLIC_API_URL_DEV;

      const token = user?.accessToken;

      if (!token) {
        console.error("No access token found");
        return;
      }
      try {
        const response = await fetch(`${apiUrl}/notebooks`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error('Failed to fetch notebooks and chapters');
        const result: Notebook[] = await response.json();
        // Instead of setting state, we'll log the result
        console.log("Fetched notebooks:", result);
      } catch (error) {
        console.error('Error fetching notebooks and chapters:', (error as Error).message);
      }
    };

    const fetchEnrolledQuestionBanks = async () => {
      const apiUrl = process.env.NODE_ENV === 'production'
        ? process.env.NEXT_PUBLIC_API_URL_PRODUCTION
        : process.env.NEXT_PUBLIC_API_URL_DEV;
      const token = user?.accessToken;

      if (!token) {
        console.error("No access token found");
        return;
      }
      try {
        const response = await fetch(`${apiUrl}/user/question-banks`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error('Failed to fetch enrolled question banks');
        const result: EnrolledQuestionBank[] = await response.json();
        setEnrolledQuestionBanks(result || []);
      } catch (error) {
        console.error('Error fetching enrolled question banks:', (error as Error).message);
        setEnrolledQuestionBanks([]);
      }
    };

    if (isAuthenticated) {
      fetchEnrolledQuestionBanks();
      fetchNotebooksAndChapters();
    }
  }, [isAuthenticated, user]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const toggleNotebook = (notebookId: string) => {
    setExpandedNotebooks(prev => ({
      ...prev,
      [notebookId]: !prev[notebookId]
    }));
    onSelectNotebook(notebookId);
  };

  const handleDeleteChapter = async (e: React.MouseEvent, notebookId: string, chapterId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await onDeleteChapter(notebookId, chapterId);
      // Remove the local state update
      toast.success('Chapter deleted successfully');
    } catch (error) {
      console.error('Error deleting chapter:', error);
      toast.error('Failed to delete chapter');
    }
  };

  const handleShareChapter = (e: React.MouseEvent, chapterId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedChapterForShare(chapterId);
    setIsShareModalOpen(true);
  };

  const handleSettingsClick = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenDropdown(openDropdown === itemId ? null : itemId);
  };

  const handleShareNotebook = (e: React.MouseEvent, notebookId: string) => {
    e.stopPropagation();
    setSelectedNotebookForShare(notebookId);
    setIsShareNotebookModalOpen(true);
  };

  const handleDeleteNotebook = async (e: React.MouseEvent, notebookId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this notebook? This action cannot be undone.')) {
      try {
        await onDeleteNotebook(notebookId);
        toast.success('Notebook deleted successfully');
      } catch (error) {
        console.error('Error deleting notebook:', error);
        toast.error('Failed to delete notebook');
      }
    }
  };

  const handleNotebookSettingsClick = (e: React.MouseEvent, notebookId: string) => {
    e.stopPropagation();
    setOpenDropdown(openDropdown === notebookId ? null : notebookId);
  };

  const TruncatedTitle: React.FC<{ title: string, maxLength: number }> = ({ title, maxLength }) => {
    const [isHovered, setIsHovered] = useState(false);
    const titleRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (isHovered && titleRef.current) {
        const titleWidth = titleRef.current.scrollWidth;
        const containerWidth = titleRef.current.offsetWidth;
        if (titleWidth > containerWidth) {
          setHoveredTitle(title);
        }
      } else {
        setHoveredTitle(null);
      }
    }, [isHovered, title]);

    return (
      <div
        ref={titleRef}
        className="truncate"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {title.length > maxLength ? `${title.substring(0, maxLength)}...` : title}
      </div>
    );
  };

  return (
    <div className="w-64 h-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 flex flex-col border-r border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h1 className="text-xl font-bold">Smartify</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
      </div>

      <ScrollArea className="flex-grow">
        <div className="p-4 space-y-6">
          {/* Question Banks section */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Question Banks</h2>
            <div className="space-y-1">
              {enrolledQuestionBanks.map(bank => (
                <Link key={bank._id} href={`/bank/${bank.bankUrl}`}>
                  <div className={cn(
                    "flex items-center p-2 rounded-md transition-colors duration-200",
                    pathname === `/bank/${bank.bankUrl}` 
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}>
                    <Library className="h-4 w-4 mr-2 flex-shrink-0" />
                    <TruncatedTitle title={bank.bankTitle} maxLength={20} />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Notebooks section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notebooks</h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={onOpenNotebookCreation}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {notebooks.map(notebook => (
                <Collapsible 
                  key={notebook._id} 
                  open={expandedNotebooks[notebook._id]} 
                  onOpenChange={() => toggleNotebook(notebook._id)}
                >
                  <div 
                    className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                    onClick={() => toggleNotebook(notebook._id)}
                  >
                    <div className="flex items-center flex-grow overflow-hidden">
                      <BookOpen className="h-4 w-4 mr-2 flex-shrink-0" />
                      <TruncatedTitle title={notebook.title} maxLength={20} />
                    </div>
                    <div className="flex items-center">
                      <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${
                        expandedNotebooks[notebook._id] ? 'transform rotate-90' : ''
                      }`} />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-1"
                            onClick={(e) => e.stopPropagation()} // Prevent triggering notebook toggle
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          align="end" 
                          className="w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md"
                        >
                          <DropdownMenuItem 
                            onClick={(e) => handleShareNotebook(e, notebook._id)}
                            className="hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Share2 className="mr-2 h-4 w-4" />
                            <span>Share Notebook</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => handleDeleteNotebook(e, notebook._id)}
                            className="hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete Notebook</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CollapsibleContent>
                    {notebook.chapters.map(chapter => (
                      <div
                        key={chapter._id}
                        className="ml-6 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center justify-between"
                        onClick={() => onChapterClick(notebook._id, chapter._id)}
                      >
                        <div className="flex-grow overflow-hidden">
                          <TruncatedTitle title={chapter.title} maxLength={20} />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-1">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            align="end" 
                            className="w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md"
                          >
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                onShareChapter(notebook._id, chapter._id);
                              }}
                              className="hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Share2 className="mr-2 h-4 w-4" />
                              <span>Share Chapter</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteChapter(notebook._id, chapter._id);
                              }}
                              className="hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete Chapter</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      <ShareNotebookModal
        isOpen={isShareNotebookModalOpen}
        onClose={() => setIsShareNotebookModalOpen(false)}
        notebookId={selectedNotebookForShare}
      />
      
      <ShareChapterModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        chapterId={selectedChapterForShare}
      />

      {hoveredTitle && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 p-2 text-center">
          <div className="animate-marquee whitespace-nowrap">
            {hoveredTitle}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
