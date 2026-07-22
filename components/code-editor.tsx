'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { updateWebsiteContent, getTemplateById } from '@/lib/website-actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import {
  SendIcon,
  Loader2,
  Download,
  Minimize,
  Maximize,
  Eye,
  EyeOff,
  AlignJustify,
  Layers,
  Monitor,
  Smartphone,
  Sparkles,
  Save,
  Globe,
  XCircle,
} from 'lucide-react';

// Dynamically import Monaco Editor (no SSR)
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
      <Loader2 className="h-6 w-6 animate-spin text-white" />
    </div>
  ),
});

// Custom theme + disable error diagnostics
const handleEditorMount = (editor: any, monaco: any) => {
  if (monaco.languages?.typescript?.javascriptDefaults) {
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    });
  }
  if (monaco.languages?.html?.htmlDefaults) {
    monaco.languages.html.htmlDefaults.setOptions({
      validate: false,
    });
  }

  monaco.editor.defineTheme('photoshop-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: 'FF79C6', fontStyle: '' },
      { token: 'tag', foreground: 'FF79C6' },
      { token: 'delimiter.html', foreground: 'f2ecec' },
      { token: 'attribute.name', foreground: 'f2ecec' },
      { token: 'attribute.value', foreground: '6fcaf2' },
      { token: 'string', foreground: 'f2ecec' },
      { token: 'text', foreground: '6fcaf2' },
    ],
    colors: {
      'editor.background': '#0a0a0a',
      'editor.foreground': '#F8F8F2',
      'editor.lineHighlightBackground': '#1a1a1a',
      'editorLineNumber.foreground': '#4a4a4a',
      'editorLineNumber.activeForeground': '#F8F8F2',
    },
  });
  monaco.editor.setTheme('photoshop-dark');

  const container = editor.getContainerDomNode();
  container.style.borderRadius = '';
  container.style.overflow = 'hidden';
  container.style.border = '';
};

export interface CodeEditorProps {
  username: string;
  initialContent: {
    html: string;
    script: string;
    data: string;
  };
}

export function CodeEditor({ username, initialContent }: CodeEditorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');

  // Core states
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(!!templateId);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [inputBarVisible, setInputBarVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('inputBarVisible');
      return stored !== null ? JSON.parse(stored) : true;
    }
    return true;
  });
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStreamingEdits, setIsStreamingEdits] = useState(false); // new: shows while applying edits

  // View toggles
  const [wordWrapEnabled, setWordWrapEnabled] = useState(false);
  const [hidePreview, setHidePreview] = useState(false);

  // Loading messages (same as before)
  const loadingMessages = [
    'The person who asks the questions is the one who is in control of the conversation. — Classic Sales Maxim',
    "You can't just ask customers what they want and then try to give that to them. By the time you get it built, they'll want something new  — Steve Jobs",
    'Give them quality. That is the best kind of advertising — Milton Hershey',
    "Fact: The world's first website is still online at info.cern.ch (created in 1991)",
    "The ultimate revenge isn't a confrontation; it is building a reality so successful that the people who doubted you wouldn't even recognize the person you have become",
    'Write to one person, not a million — Classic Copywriting Maxim',
    "How many programmers does it take to change a light bulb? None, that's a hardware problem",
    'The first hard drive weighed over a ton and stored only 5MB of data',
    'People do not want to buy a quarter inch drill, they want a quarterinch hole — Theodore Levitt',
  ];
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Rotate message every 6s while generating
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * loadingMessages.length);
        } while (newIndex === prev && loadingMessages.length > 1);
        return newIndex;
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [isGenerating, loadingMessages.length]);

  useEffect(() => {
    if (isGenerating) {
      setCurrentMessageIndex(0);
    }
  }, [isGenerating]);

  const aiInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus AI input
  useEffect(() => {
    if (inputBarVisible) {
      const timer = setTimeout(() => {
        aiInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [inputBarVisible]);

  useEffect(() => {
    localStorage.setItem('inputBarVisible', JSON.stringify(inputBarVisible));
  }, [inputBarVisible]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Data extraction and draft state
  const extractDataFields = (dataString: string) => {
    if (!dataString) return '';
    const match = dataString.match(/const\s+data\s*=\s*\{([\s\S]*)\}\s*;?\s*$/i);
    if (match) return match[1].trim();
    return dataString;
  };

  const [draftData, setDraftData] = useState(extractDataFields(initialContent.data));
  const [draftHtml, setDraftHtml] = useState(initialContent.html);
  const [savedHtml, setSavedHtml] = useState(initialContent.html);
  const [savedData, setSavedData] = useState(extractDataFields(initialContent.data));

  // Load template if templateId present
  useEffect(() => {
    if (!templateId) return;
    async function loadTemplate() {
      try {
        const result = await getTemplateById(Number(templateId));
        if (result.success && result.html && result.data) {
          const extracted = extractDataFields(result.data);
          setDraftHtml(result.html);
          setDraftData(extracted);
          setSavedHtml(result.html);
          setSavedData(extracted);
          toast.info('Template loaded', {
            description: 'Edit and click Publish to make it live.',
            position: 'top-center',
          });
        } else {
          toast.error('Failed to load template', {
            description: result.error || 'Template not found',
          });
        }
      } catch (error) {
        console.error(error);
        toast.error('Error loading template');
      } finally {
        setIsLoadingTemplate(false);
      }
    }
    loadTemplate();
  }, [templateId]);

  const hasUnsavedChanges = draftHtml !== savedHtml;

  // Preview code – uses draftHtml so AI edits show live
  const previewCode = useMemo(() => {
    return draftHtml.replace(
      '<script type="text/babel">',
      `<script>
const data = {
${savedData}
};
</script>
<script type="text/babel">`
    );
  }, [draftHtml, savedData]);

  // Iframe and scroll persistence (same as before, simplified for brevity)
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  const isRestoringScroll = useRef(false);

  const captureScrollPosition = useCallback(() => {
    if (iframeRef.current?.contentWindow && !isRestoringScroll.current) {
      try {
        const { scrollX, scrollY } = iframeRef.current.contentWindow;
        setScrollPosition({ x: scrollX, y: scrollY });
      } catch (error) {
        console.log('Could not capture scroll position:', error);
      }
    }
  }, []);

  const restoreScrollPosition = () => {
    if (iframeRef.current?.contentWindow) {
      isRestoringScroll.current = true;
      const attemptRestore = (attempt = 1) => {
        try {
          iframeRef.current?.contentWindow?.scrollTo(scrollPosition.x, scrollPosition.y);
        } catch (error) {
          console.log('Scroll restore error:', error);
        }
        if (attempt < 3) setTimeout(() => attemptRestore(attempt + 1), attempt * 100);
        else isRestoringScroll.current = false;
      };
      setTimeout(attemptRestore, 50);
    }
  };

  const handleIframeLoad = () => {
    if (iframeRef.current?.contentWindow) {
      try {
        const doc = iframeRef.current.contentWindow.document;
        const script = doc.createElement('script');
        script.textContent = `
          let preservedScroll = { x: ${scrollPosition.x}, y: ${scrollPosition.y} };
          const preserveScroll = () => {
            preservedScroll = { x: window.scrollX, y: window.scrollY };
            window.parent.postMessage({ type: 'scrollUpdate', position: preservedScroll }, '*');
          };
          const restoreScroll = () => {
            requestAnimationFrame(() => { window.scrollTo(preservedScroll.x, preservedScroll.y); });
          };
          const observer = new MutationObserver(() => { setTimeout(restoreScroll, 20); });
          window.addEventListener('load', () => {
            observer.observe(document.body, { childList: true, subtree: true });
            restoreScroll();
          });
          window.addEventListener('scroll', () => { requestAnimationFrame(preserveScroll); });
        `;
        doc.head.appendChild(script);
      } catch (error) {
        console.log('Scroll script injection failed:', error);
      }
    }
    restoreScrollPosition();
  };

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    const handleScroll = () => {
      if (!isRestoringScroll.current) captureScrollPosition();
    };
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'scrollUpdate') setScrollPosition(event.data.position);
    };
    try {
      iframe.contentWindow.addEventListener('scroll', handleScroll);
      window.addEventListener('message', handleMessage);
      return () => {
        iframe.contentWindow?.removeEventListener('scroll', handleScroll);
        window.removeEventListener('message', handleMessage);
      };
    } catch (error) {
      console.log('Scroll listener error:', error);
    }
  }, [previewCode, captureScrollPosition]);

  // Open draft preview in new tab
  const openDraftPreview = () => {
    const currentPreviewCode = draftHtml.replace(
      '<script type="text/babel">',
      `<script>
const data = {
${draftData}
};
</script>
<script type="text/babel">`
    );
    const key = `draft_preview_${Date.now()}`;
    sessionStorage.setItem(key, currentPreviewCode);
    const draftUrl = `/draft/${username}?previewKey=${encodeURIComponent(key)}`;
    window.open(draftUrl, '_blank');
  };

  // Toggle fullscreen for iframe
  const toggleFullscreen = () => {
    if (!iframeRef.current) return;
    if (!document.fullscreenElement) {
      iframeRef.current.requestFullscreen().catch((err) => {
        console.error(`Fullscreen error: ${err.message}`);
        toast.error('Fullscreen failed', {
          description: 'Please check browser permissions',
          position: 'top-center',
        });
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Save handler
  const handleSave = useCallback(() => {
    captureScrollPosition();
    setSavedHtml(draftHtml);
    toast.success('Changes saved', {
      description: 'Your draft has been updated.',
      position: 'top-center',
      duration: 2000,
    });
  }, [draftHtml, captureScrollPosition]);

  // Keyboard shortcut: Ctrl+S
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSave]);

  // Publish handler
  const handlePublish = async () => {
    // (demo sign-in modal handling omitted for brevity)
    if (username === 'demo') {
      // showSignInModal set to true (you can add that)
      return;
    }
    setIsPublishing(true);
    try {
      const result = await updateWebsiteContent(username, draftHtml, draftData, draftData);
      if (result.success) {
        toast.success('Published!', {
          description: 'Your website is now live.',
          position: 'top-center',
        });
        router.replace(`/edit_new/${username}`);
      } else {
        toast.error(result.error || 'Failed to publish website');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsPublishing(false);
    }
  };

  // ============================================================
  // ** STREAMING AI GENERATION – MAIN FEATURE **
  // ============================================================
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a prompt for AI assistance', { position: 'top-center' });
      return;
    }

    setIsGenerating(true);
    setIsStreamingEdits(false); // reset

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentCode: draftHtml, prompt: aiPrompt }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let editCount = 0;

      // We'll update draftHtml on each edit.
      // The editor and preview will re‑render automatically.
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          try {
            const edit = JSON.parse(line);
            // Apply the edit
            setDraftHtml((prev) => {
              if (!prev.includes(edit.find)) {
                console.warn('Find string not found:', edit.find);
                return prev;
              }
              return prev.replace(edit.find, edit.replace);
            });
            editCount++;
            if (editCount === 1) {
              setIsStreamingEdits(true); // show streaming indicator after first edit
            }
          } catch (e) {
            console.error('Failed to parse JSON line:', line, e);
          }
        }
      }

      // Process remaining buffer
      if (buffer.trim()) {
        try {
          const edit = JSON.parse(buffer);
          setDraftHtml((prev) => {
            if (!prev.includes(edit.find)) {
              console.warn('Find string not found:', edit.find);
              return prev;
            }
            return prev.replace(edit.find, edit.replace);
          });
          editCount++;
          if (editCount === 1) setIsStreamingEdits(true);
        } catch (e) {
          console.error('Failed to parse final buffer:', buffer, e);
        }
      }

      // All edits applied
      setAiPrompt('');
      setIsStreamingEdits(false);
      toast.success(`AI applied ${editCount} edit${editCount > 1 ? 's' : ''}!`, {
        description: 'Review changes and save if you like.',
        position: 'top-center',
      });
      aiInputRef.current?.focus();
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('An unexpected error occurred', { position: 'top-center' });
      setIsStreamingEdits(false);
    } finally {
      setIsGenerating(false);
    }
  };
  // ============================================================

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAIGenerate();
    }
  };

  // Download HTML
  const handleDownload = () => {
    const fullHtml = savedHtml.replace(
      '<script type="text/babel">',
      `<script>
const data = {
${savedData}
};
</script>
<script type="text/babel">`
    );
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${username}-website.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Website exported!', {
      description: 'Your HTML file has been downloaded.',
      position: 'top-center',
    });
  };

  if (isLoadingTemplate) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <Loader2 className="h-8 w-8 animate-spin text-red-500 mr-2" />
        <span>Loading template into editor...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-white overflow-hidden font-sans selection:bg-red-500/30">
      {/* Photoshop-style top bar */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-1 bg-[#141414] border-b border-white/5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500/80" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/80" />
            <div className="w-2 h-2 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs font-mono tracking-widest text-white/30 select-none">EDITOR</span>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Monitor className="w-3 h-3" />
            <span>{username}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle group */}
          <div className="flex items-center bg-white/5 rounded-md p-0.5 border border-white/5">
            <button
              onClick={() => setHidePreview(false)}
              className={`p-1.5 rounded transition-all ${
                !hidePreview ? 'bg-white/15 text-white shadow-sm' : 'text-white/40 hover:text-white/70'
              }`}
              title="Show preview"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setHidePreview(true)}
              className={`p-1.5 rounded transition-all ${
                hidePreview ? 'bg-white/15 text-white shadow-sm' : 'text-white/40 hover:text-white/70'
              }`}
              title="Hide preview (focus mode)"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Word wrap toggle */}
          <button
            onClick={() => setWordWrapEnabled(!wordWrapEnabled)}
            className={`p-1.5 rounded transition-all ${
              wordWrapEnabled ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
            }`}
            title="Toggle word wrap"
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-white/10" />

          {/* Device preview */}
          <div className="flex items-center bg-white/5 rounded-md p-0.5 border border-white/5">
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-1.5 rounded transition-all ${
                viewMode === 'desktop' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-1.5 rounded transition-all ${
                viewMode === 'mobile' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={openDraftPreview}
            className="p-1.5 rounded text-white/40 hover:text-white/70 transition-all hover:bg-white/5"
            title="Open preview in new tab"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded text-white/40 hover:text-white/70 transition-all hover:bg-white/5"
            title="Fullscreen preview"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>

          <div className="h-4 w-px bg-white/10" />

          <button
            onClick={handleSave}
            className={`px-3 py-1 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
              hasUnsavedChanges
                ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                : 'text-white/30'
            }`}
          >
            <Save className="w-3 h-3" />
            Save
            <span className="text-[10px] opacity-50">⌘S</span>
          </button>

          <button
            onClick={handlePublish}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 rounded text-xs font-semibold transition-all flex items-center gap-1.5 shadow-lg shadow-red-600/20 hover:shadow-red-600/40"
          >
            {isPublishing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Globe className="w-3 h-3" />
                Publish
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 rounded text-white/40 hover:text-white/70 transition-all hover:bg-white/5"
            title="Download HTML"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Close / Back button */}
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded text-white/40 hover:text-white/70 transition-all hover:bg-white/5 hover:scale-110"
            title="Close editor and go back"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main workspace */}
      <div className="flex-1 flex gap-1 p-1 min-h-0 overflow-hidden bg-[#0d0d0d]">
        {/* Preview Panel */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            hidePreview
              ? 'w-0 opacity-0 pointer-events-none flex-none'
              : 'flex-1'
          } flex flex-col bg-[#0a0a0a] border border-white/5 rounded-sm overflow-hidden shadow-inner`}
        >
          <div
            className={`w-full h-full transition-all duration-300 flex items-center justify-center ${
              viewMode === 'desktop' ? 'max-w-7xl' : 'max-w-[480px]'
            } mx-auto`}
            style={{ zoom: 0.6 }}
          >
            <div
              className={`w-full ${
                viewMode === 'desktop' ? 'aspect-[16/9]' : 'aspect-[9/13]'
              } max-h-full bg-white rounded-sm shadow-2xl overflow-hidden`}
            >
              <iframe
                ref={iframeRef}
                srcDoc={previewCode}
                onLoad={handleIframeLoad}
                className="w-full h-full border-0"
                title="Live Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        </div>

        {/* Editor Panel */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            hidePreview ? 'flex-1' : 'flex-[0.4]'
          } flex flex-col bg-[#0f0f0f] border border-white/5 rounded-sm overflow-hidden shadow-inner`}
        >
          {/* Editor toolbar */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#141414] border-b border-white/5">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono tracking-widest text-white/30 uppercase">HTML</span>
              <span className="text-[10px] text-white/20">|</span>
              <span className="text-[10px] text-white/20">Line {draftHtml.split('\n').length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/20">{draftHtml.length} chars</span>
              {hasUnsavedChanges && (
                <span className="flex items-center gap-1 text-[10px] text-amber-400/80 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  unsaved
                </span>
              )}
              {/* Show streaming indicator while edits are applied */}
              {isStreamingEdits && (
                <span className="flex items-center gap-1 text-[10px] text-green-400/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  streaming edits...
                </span>
              )}
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 min-h-0 relative">
            <MonacoEditor
              height="100%"
              language="html"
              value={draftHtml}
              onChange={(value) => setDraftHtml(value || '')}
              theme="photoshop-dark"
              onMount={handleEditorMount}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "Menlo, Monaco, 'Courier New', monospace",
                lineNumbers: 'on',
                wordWrap: wordWrapEnabled ? 'on' : 'off',
                quickSuggestions: true,
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: 'on',
                tabCompletion: 'on',
                wordBasedSuggestions: 'currentDocument',
                snippetSuggestions: 'inline',
                inlineSuggest: { enabled: true },
                padding: { top: 12, bottom: 12 },
                autoClosingBrackets: 'always',
                autoClosingQuotes: 'always',
                matchBrackets: 'always',
                scrollBeyondLastLine: false,
                renderLineHighlight: 'none',
                unicodeHighlight: {
                  ambiguousCharacters: false,
                  invisibleCharacters: false,
                  nonBasicASCII: false,
                },
                automaticLayout: true,
                glyphMargin: false,
                folding: false,
                find: {
                  addExtraSpaceOnTop: false,
                  autoFindInSelection: 'never',
                  seedSearchStringFromSelection: 'never',
                },
                readOnly: isGenerating, // editor is read-only while generating
              }}
            />

            {/* AI overlay – shown while waiting for the first edit */}
            {isGenerating && !isStreamingEdits && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-20">
                <div className="flex flex-col items-center gap-4 max-w-xs text-center">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-red-400" />
                    <span className="text-xs font-medium text-white/80 tracking-wide">AI is thinking...</span>
                  </div>
                  <p className="text-[11px] text-white/40 italic leading-relaxed transition-opacity duration-300">
                    {loadingMessages[currentMessageIndex]}
                  </p>
                  <div className="w-32 h-0.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-500 to-orange-400 animate-[progress_2s_ease-in-out_infinite]" />
                  </div>
                  <style>{`
                    @keyframes progress {
                      0% { width: 5%; }
                      50% { width: 95%; }
                      100% { width: 5%; }
                    }
                  `}</style>
                </div>
              </div>
            )}

            {/* Optional: show a subtle "applying" overlay while streaming edits */}
            {isStreamingEdits && (
              <div className="absolute top-2 right-2 z-10 bg-green-500/20 text-green-300 text-[10px] px-2 py-1 rounded-full border border-green-500/30 backdrop-blur-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                applying
              </div>
            )}
          </div>

          {/* AI Input Bar */}
          <div className="flex-shrink-0 px-3 py-2 bg-[#141414] border-t border-white/5 flex items-center gap-2">
            {inputBarVisible ? (
              <div className="flex-1 flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    ref={aiInputRef}
                    type="text"
                    placeholder="Ask AI to generate or modify your HTML..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={isGenerating}
                    className="w-full bg-black/40 border border-white/10 rounded-md px-4 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
                  />
                  <button
                    onClick={handleAIGenerate}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md bg-red-500/20 hover:bg-red-500/40 transition disabled:opacity-40"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                    ) : (
                      <SendIcon className="w-3.5 h-3.5 text-white" />
                    )}
                  </button>
                </div>
                <button
                  onClick={() => setInputBarVisible(false)}
                  className="text-xs text-white/40 hover:text-white/70 transition"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setInputBarVisible(true)}
                className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition px-3 py-1 rounded-full border border-white/10 hover:border-white/30"
              >
                <Sparkles className="w-3 h-3" />
                Ask AI
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <footer className="flex-shrink-0 px-4 py-1 bg-[#141414] border-t border-white/5 flex items-center justify-between text-[10px] text-white/30">
        <div className="flex items-center gap-4">
          <span>Ready</span>
          <span className="w-px h-3 bg-white/10" />
          <span>HTML • {draftHtml.split('\n').length} lines</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{username}</span>
          <span className="w-px h-3 bg-white/10" />
          <span>v1.0</span>
        </div>
      </footer>
    </div>
  );
}