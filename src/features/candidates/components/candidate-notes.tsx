import React, { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";
import { Badge } from "../../../components/ui/badge";
import {
  MessageSquare,
  Send,
  AtSign,
  Clock,
  Edit,
  Trash2,
  User,
} from "lucide-react";
import type { Note, Mention } from "../../../types";
import { useAppStore } from "../../../lib/store";

interface CandidateNotesProps {
  notes: Note[];
  onAddNote: (content: string, mentions: Mention[]) => void;
  onEditNote?: (noteId: string, content: string, mentions: Mention[]) => void;
  onDeleteNote?: (noteId: string) => void;
}

interface MentionSuggestion {
  id: string;
  name: string;
  email: string;
  type: "user" | "candidate";
}

// Mock mention suggestions - in a real app, this would come from your user/candidate API
const mockTeamMembers: MentionSuggestion[] = [
  { id: "1", name: "John Smith", email: "john@company.com", type: "user" },
  { id: "2", name: "Sarah Johnson", email: "sarah@company.com", type: "user" },
  { id: "3", name: "Mike Chen", email: "mike@company.com", type: "user" },
  { id: "4", name: "Emily Davis", email: "emily@company.com", type: "user" },
  { id: "5", name: "David Wilson", email: "david@company.com", type: "user" },
  { id: "6", name: "Lisa Brown", email: "lisa@company.com", type: "user" },
];

export const CandidateNotes: React.FC<CandidateNotesProps> = ({
  notes,
  onAddNote,
  onEditNote,
  onDeleteNote,
}) => {
  const { candidates } = useAppStore();
  const [newNoteContent, setNewNoteContent] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [selectedMentions, setSelectedMentions] = useState<Mention[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionDropdownRef = useRef<HTMLDivElement>(null);

  // Combine team members and other candidates for mention suggestions
  const allMentionSuggestions: MentionSuggestion[] = [
    ...mockTeamMembers,
    ...candidates
      .filter((candidate) => candidate.name && candidate.email)
      .map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        type: "candidate" as const,
      })),
  ];

  const filteredSuggestions = allMentionSuggestions.filter(
    (suggestion) =>
      suggestion.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
      suggestion.email.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const handleTextareaChange = (value: string) => {
    if (editingNoteId) {
      setEditContent(value);
    } else {
      setNewNoteContent(value);
    }

    // Check for @ mentions
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    if (atIndex !== -1 && atIndex === cursorPosition - 1) {
      // Just typed @
      setMentionQuery("");
      setShowMentions(true);
      updateMentionPosition(textarea);
    } else if (
      atIndex !== -1 &&
      !textBeforeCursor.substring(atIndex).includes(" ")
    ) {
      // Typing after @
      const query = textBeforeCursor.substring(atIndex + 1);
      setMentionQuery(query);
      setShowMentions(true);
      updateMentionPosition(textarea);
    } else {
      setShowMentions(false);
    }
  };

  const updateMentionPosition = (textarea: HTMLTextAreaElement) => {
    // Position dropdown directly below the textarea
    const rect = textarea.getBoundingClientRect();

    setMentionPosition({
      top: rect.bottom + window.scrollY + 4, // 4px gap below textarea
      left: rect.left + window.scrollX,
    });
  };

  const insertMention = (suggestion: MentionSuggestion) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const currentValue = editingNoteId ? editContent : newNoteContent;
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = currentValue.substring(0, cursorPosition);
    const textAfterCursor = currentValue.substring(cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    const newText =
      textBeforeCursor.substring(0, atIndex) +
      `@${suggestion.name} ` +
      textAfterCursor;

    if (editingNoteId) {
      setEditContent(newText);
    } else {
      setNewNoteContent(newText);
    }

    // Add to selected mentions if not already there
    const mention: Mention = {
      id: suggestion.id,
      name: suggestion.name,
      email: suggestion.email,
      type: suggestion.type,
    };

    if (!selectedMentions.find((m) => m.id === mention.id)) {
      setSelectedMentions((prev) => [...prev, mention]);
    }

    setShowMentions(false);
    textarea.focus();
  };

  const handleSubmitNote = () => {
    const content = editingNoteId ? editContent : newNoteContent;
    if (!content.trim()) return;

    if (editingNoteId && onEditNote) {
      onEditNote(editingNoteId, content, selectedMentions);
      setEditingNoteId(null);
      setEditContent("");
    } else {
      onAddNote(content, selectedMentions);
      setNewNoteContent("");
    }

    setSelectedMentions([]);
  };

  const startEditing = (note: Note) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
    setSelectedMentions(note.mentions || []);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditContent("");
    setSelectedMentions([]);
  };

  const formatNoteContent = (content: string, mentions: Mention[]) => {
    let formattedContent = content;

    mentions.forEach((mention) => {
      const mentionRegex = new RegExp(`@${mention.name}`, "g");
      formattedContent = formattedContent.replace(
        mentionRegex,
        `<span class="mention bg-primary/10 text-primary px-1 py-0.5 rounded text-sm font-medium">@${mention.name}</span>`
      );
    });

    return { __html: formattedContent };
  };

  // Close mentions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mentionDropdownRef.current &&
        !mentionDropdownRef.current.contains(event.target as Node)
      ) {
        setShowMentions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5 text-primary" />
          Notes & Comments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new note */}
        <div className="relative space-y-3">
          <Textarea
            ref={textareaRef}
            placeholder="Add a note... Use @ to mention someone"
            value={editingNoteId ? editContent : newNoteContent}
            onChange={(e) => handleTextareaChange(e.target.value)}
            className="min-h-[100px] resize-none"
          />

          {/* Mention suggestions dropdown */}
          {showMentions && filteredSuggestions.length > 0 && (
            <div
              ref={mentionDropdownRef}
              className="fixed z-50 w-72 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
              style={{
                top: mentionPosition.top,
                left: mentionPosition.left,
              }}
            >
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2"
                  onClick={() => insertMention(suggestion)}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      suggestion.type === "user"
                        ? "bg-blue-600/20 border border-blue-500/30"
                        : "bg-purple-600/20 border border-purple-500/30"
                    }`}
                  >
                    <User
                      className={`h-4 w-4 ${
                        suggestion.type === "user"
                          ? "text-blue-400"
                          : "text-purple-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {suggestion.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {suggestion.email}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`ml-auto text-xs ${
                      suggestion.type === "user"
                        ? "bg-blue-600/10 text-blue-400 border-blue-500/30"
                        : "bg-purple-600/10 text-purple-400 border-purple-500/30"
                    }`}
                  >
                    {suggestion.type === "user" ? "Team" : "Candidate"}
                  </Badge>
                </button>
              ))}
            </div>
          )}

          {/* Selected mentions */}
          {selectedMentions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Mentions:</span>
              {selectedMentions.map((mention) => (
                <Badge key={mention.id} variant="secondary" className="text-xs">
                  <AtSign className="h-3 w-3 mr-1" />
                  {mention.name}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleSubmitNote}
              disabled={!(editingNoteId ? editContent : newNoteContent).trim()}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {editingNoteId ? "Update Note" : "Add Note"}
            </Button>
            {editingNoteId && (
              <Button variant="outline" onClick={cancelEditing}>
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Notes list */}
        <div className="space-y-4">
          {sortedNotes.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No notes yet</p>
              <p className="text-sm text-muted-foreground/70">
                Add the first note to start tracking this candidate's progress
              </p>
            </div>
          ) : (
            sortedNotes.map((note) => (
              <div
                key={note.id}
                className="border border-border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div
                      className="text-sm text-foreground leading-relaxed"
                      dangerouslySetInnerHTML={formatNoteContent(
                        note.content,
                        note.mentions || []
                      )}
                    />

                    {/* Mentions display */}
                    {note.mentions && note.mentions.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {note.mentions.map((mention) => (
                          <Badge
                            key={mention.id}
                            variant="outline"
                            className="text-xs bg-primary/10 text-primary border-primary/20"
                          >
                            <AtSign className="h-3 w-3 mr-1" />
                            {mention.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {onEditNote && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(note)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDeleteNote && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteNote(note.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border pt-2">
                  <Clock className="h-3 w-3" />
                  <span>
                    {note.authorName} •{" "}
                    {new Date(note.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
