import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  User,
  Calendar,
  Edit2,
  Trash2,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";
import { Card, CardContent } from "../../../components/ui/card";
import { useAppStore } from "../../../lib/store";
import { CandidatesService } from "../../../lib/db/operations";
import type { Note, Mention } from "../../../types";

interface NotesEditorProps {
  candidateId: string;
}

// Mock users for @mentions - in a real app, this would come from an API
const mockUsers = [
  { id: "1", name: "John Smith", email: "john@company.com" },
  { id: "2", name: "Sarah Johnson", email: "sarah@company.com" },
  { id: "3", name: "Mike Davis", email: "mike@company.com" },
  { id: "4", name: "Emily Chen", email: "emily@company.com" },
  { id: "5", name: "David Wilson", email: "david@company.com" },
];

export const NotesEditor = ({ candidateId }: NotesEditorProps) => {
  const { candidates, updateCandidate } = useAppStore();
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPosition, setMentionPosition] = useState(0);
  const [filteredUsers, setFilteredUsers] = useState(mockUsers);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const candidate = candidates.find((c) => c.id === candidateId);
  const notes = candidate?.notes || [];

  // Handle @mentions
  useEffect(() => {
    if (mentionQuery) {
      const filtered = mockUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(mentionQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(mockUsers);
    }
  }, [mentionQuery]);

  const handleTextChange = (value: string, isEditing = false) => {
    if (isEditing) {
      setEditingContent(value);
    } else {
      setNewNote(value);
    }

    // Check for @mentions
    const textarea = isEditing ? editTextareaRef.current : textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf("@");

    if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtSymbol + 1);

      // Check if there's a space after @ (which would end the mention)
      if (!textAfterAt.includes(" ") && textAfterAt.length <= 20) {
        setMentionQuery(textAfterAt);
        setMentionPosition(lastAtSymbol);
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (user: (typeof mockUsers)[0], isEditing = false) => {
    const currentText = isEditing ? editingContent : newNote;
    const beforeMention = currentText.substring(0, mentionPosition);
    const afterMention = currentText.substring(
      mentionPosition + mentionQuery.length + 1
    );
    const newText = `${beforeMention}@${user.name}${afterMention}`;

    if (isEditing) {
      setEditingContent(newText);
    } else {
      setNewNote(newText);
    }

    setShowMentions(false);
    setMentionQuery("");

    // Focus back to textarea
    const textarea = isEditing ? editTextareaRef.current : textareaRef.current;
    if (textarea) {
      textarea.focus();
      const newCursorPosition = beforeMention.length + user.name.length + 1;
      setTimeout(() => {
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 0);
    }
  };

  const extractMentions = (content: string): Mention[] => {
    // Match @Name or @First Last (up to 2 words)
    const mentionRegex = /@([A-Za-z]+(?:\s+[A-Za-z]+)?)/g;
    const mentions: Mention[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      const mentionName = match[1];
      // Find the user in our mock data
      const user = mockUsers.find((u) => u.name === mentionName);
      if (user) {
        mentions.push({
          id: user.id,
          name: user.name,
          email: user.email,
          type: "user",
        });
      }
    }

    return mentions;
  };

  const handleSubmitNote = async () => {
    if (!newNote.trim() || !candidate) return;

    setIsSubmitting(true);
    try {
      const mentions = extractMentions(newNote);
      const note: Omit<Note, "id"> = {
        content: newNote.trim(),
        authorId: "current-user", // In a real app, this would be the current user's ID
        authorName: "Current User", // In a real app, this would be the current user's name
        createdAt: new Date(),
        mentions,
      };

      await CandidatesService.addNote(candidateId, note);

      // Refresh candidate data
      const updatedCandidate = await CandidatesService.getById(candidateId);
      if (updatedCandidate) {
        await updateCandidate(candidateId, { notes: updatedCandidate.notes });
      }

      setNewNote("");
    } catch (error) {
      console.error("Error adding note:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingContent(note.content);
  };

  const handleSaveEdit = async () => {
    if (!editingContent.trim() || !candidate || !editingNoteId) return;

    try {
      const mentions = extractMentions(editingContent);
      const updatedNotes = candidate.notes.map((note) =>
        note.id === editingNoteId
          ? { ...note, content: editingContent.trim(), mentions }
          : note
      );

      await updateCandidate(candidateId, { notes: updatedNotes });
      setEditingNoteId(null);
      setEditingContent("");
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!candidate) return;

    try {
      const updatedNotes = candidate.notes.filter((note) => note.id !== noteId);
      await updateCandidate(candidateId, { notes: updatedNotes });
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const renderNoteContent = (content: string) => {
    // Replace @mentions with styled spans
    return content.replace(
      /@(\w+(?:\s+\w+)*)/g,
      '<span class="bg-blue-600/20 text-blue-400 px-1 rounded border border-blue-500/30">@$1</span>'
    );
  };

  return (
    <div className="space-y-4">
      {/* Add new note */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          placeholder="Add a note... Use @name to mention someone"
          value={newNote}
          onChange={(e) => handleTextChange(e.target.value)}
          className="min-h-[100px] resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSubmitNote();
            }
          }}
        />

        {/* Mentions dropdown */}
        {showMentions && (
          <div
            className="absolute z-10 mt-1 w-64 border border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto"
            style={{ backgroundColor: "#0d1025" }}
          >
            {filteredUsers.map((user) => (
              <Button
                key={user.id}
                variant="ghost"
                className="w-full px-3 py-2 text-left hover:bg-gray-700 flex items-center gap-2 h-auto justify-start text-white"
                onClick={() => insertMention(user)}
              >
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
              </Button>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-gray-400">Press Cmd+Enter to submit</p>
          <Button
            onClick={handleSubmitNote}
            disabled={!newNote.trim() || isSubmitting}
            size="sm"
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? "Adding..." : "Add Note"}
          </Button>
        </div>
      </div>

      {/* Existing notes */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-300">No notes yet</p>
            <p className="text-xs text-gray-500">
              Add the first note to start tracking candidate interactions
            </p>
          </div>
        ) : (
          notes
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
            .map((note) => (
              <Card
                key={note.id}
                className="border-l-4 border-l-blue-500 border border-gray-700"
                style={{ backgroundColor: "#0d1025" }}
              >
                <CardContent className="p-4">
                  {editingNoteId === note.id ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <Textarea
                          ref={editTextareaRef}
                          value={editingContent}
                          onChange={(e) =>
                            handleTextChange(e.target.value, true)
                          }
                          className="min-h-[80px] resize-none"
                        />

                        {/* Mentions dropdown for editing */}
                        {showMentions && (
                          <div
                            className="absolute z-10 mt-1 w-64 border border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto"
                            style={{ backgroundColor: "#0d1025" }}
                          >
                            {filteredUsers.map((user) => (
                              <Button
                                key={user.id}
                                variant="ghost"
                                className="w-full px-3 py-2 text-left hover:bg-gray-700 flex items-center gap-2 h-auto justify-start text-white"
                                onClick={() => insertMention(user, true)}
                              >
                                <User className="h-4 w-4 text-gray-400" />
                                <div>
                                  <p className="text-sm font-medium text-white">
                                    {user.name}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {user.email}
                                  </p>
                                </div>
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveEdit}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingNoteId(null);
                            setEditingContent("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-white">
                            {note.authorName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Calendar className="h-3 w-3" />
                            {formatDate(note.createdAt)}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditNote(note)}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteNote(note.id)}
                            className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div
                        className="text-sm text-gray-300 whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{
                          __html: renderNoteContent(note.content),
                        }}
                      />
                      {note.mentions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {note.mentions.map((mention, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30"
                            >
                              @{mention.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </div>
  );
};
