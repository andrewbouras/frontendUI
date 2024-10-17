'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/component/Sidebar';
import QuestionComponent from '@/components/component/QuestionComponent';
import ChapterCreationComponent from '@/components/ChapterCreationComponent';
import NotebookCreationComponent from '@/components/NotebookCreationComponent';
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Shuffle } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import ShareButton from '@/components/component/ShareButton';

type Notebook = {
  _id: string;
  title: string;
  chapters: { _id: string; title: string; notebookId: string }[];
};

export default function Page() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<{ _id: string; title: string; notebookId: string } | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showNotebookCreation, setShowNotebookCreation] = useState(false);
  const [showChapterCreation, setShowChapterCreation] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRandomized, setIsRandomized] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  // ... (keep existing useEffects and functions)

  const handleChapterClick = (notebookId: string, chapterId: string) => {
    const notebook = notebooks.find(n => n._id === notebookId);
    const chapter = notebook?.chapters.find(c => c._id === chapterId);
    if (notebook && chapter) {
      setSelectedNotebook(notebook);
      setSelectedChapter(chapter);
      setIsSidebarOpen(false);
      router.push(`/smart?notebook=${notebookId}&chapter=${chapterId}`, undefined, { shallow: true });
    }
  };

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleBackToHome = () => {
    setSelectedChapter(null);
    setIsSidebarOpen(true);
    router.push('/smart', undefined, { shallow: true });
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar
        isPremium={isPremium}
        onDeleteChapter={handleDeleteChapter}
        onShareChapter={handleShareChapter}
        onOpenNotebookCreation={() => setShowNotebookCreation(true)}
        onSelectNotebook={handleNotebookSelect}
        selectedNotebookId={selectedNotebook?._id}
        notebooks={notebooks}
        onDeleteNotebook={handleDeleteNotebook}
        onShareNotebook={handleShareNotebook}
        onChapterClick={handleChapterClick}
        isOpen={isSidebarOpen}
        onToggle={handleSidebarToggle}
      />
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow">
          <Button onClick={handleBackToHome} variant="ghost">Smartify</Button>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsRandomized(!isRandomized)}
              className={`${isRandomized ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
              title={isRandomized ? "Randomize Questions (On)" : "Randomize Questions (Off)"}
            >
              <Shuffle className={`h-5 w-5 ${isRandomized ? 'text-blue-500 dark:text-blue-400' : ''}`} />
            </Button>
            {selectedChapter && <ShareButton type="chapter" id={selectedChapter._id} />}
          </div>
        </header>
        <main className="p-6">
          {selectedChapter ? (
            <QuestionComponent
              fetchUrl={`/api/chapters/${selectedChapter._id}/questions`}
              postUrl={`/api/questions/${selectedChapter._id}/responses`}
              title={selectedChapter.title}
              settingsButton={null}
              isRandomized={isRandomized}
              id={selectedChapter._id}
              theme={theme as 'light' | 'dark'}
              onNewSimilarQuestions={() => {}}
            />
          ) : (
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Welcome to Smartify</h1>
              <p className="mb-4">Drag and drop a PDF file here to create a new chapter</p>
              <Button onClick={() => setShowChapterCreation(true)}>Create New Chapter</Button>
            </div>
          )}
        </main>
      </div>
      {showNotebookCreation && (
        <NotebookCreationComponent
          setShowAddNotebook={setShowNotebookCreation}
          setNotebooks={setNotebooks}
          notebooks={notebooks}
        />
      )}
      {showChapterCreation && (
        <ChapterCreationComponent
          selectedNotebook={selectedNotebook}
          setSelectedNotebook={setSelectedNotebook}
          notebooks={notebooks}
          setNotebooks={setNotebooks}
          setShowAddChapter={setShowChapterCreation}
          onSubmit={handleCreateChapter}
        />
      )}
    </div>
  );
}