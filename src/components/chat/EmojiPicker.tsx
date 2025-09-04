"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const commonEmojis = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
  "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
  "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
  "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬",
  "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗",
  "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😯", "😦", "😧",
  "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢",
  "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "💩", "👻", "💀",
  "☠️", "👽", "👾", "🤖", "😺", "😸", "😹", "😻", "😼", "😽",
  "🙀", "😿", "😾", "🙈", "🙉", "🙊", "👶", "👧", "🧒", "👦",
  "👩", "🧑", "👨", "👵", "🧓", "👴", "👮", "🕵️", "👷", "👸",
  "🤴", "👳", "👲", "🧕", "🤵", "👰", "🤰", "🤱", "👼", "🎅",
  "🤶", "🧙", "🧚", "🧛", "🧜", "🧝", "🧞", "🧟", "🧌", "👹",
  "👺", "👻", "👽", "👾", "🤖", "😺", "😸", "😹", "😻", "😼"
];

export default function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState("smileys");

  const categories = [
    { id: "smileys", name: "😀", label: "Smileys" },
    { id: "animals", name: "🐶", label: "Animals" },
    { id: "food", name: "🍎", label: "Food" },
    { id: "activities", name: "⚽", label: "Activities" },
    { id: "travel", name: "✈️", label: "Travel" },
    { id: "objects", name: "💡", label: "Objects" },
    { id: "symbols", name: "❤️", label: "Symbols" },
    { id: "flags", name: "🏁", label: "Flags" }
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10">
          <span className="text-lg">😀</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" side="top" align="center">
        <div className="space-y-4">
          {/* Category Tabs */}
          <div className="flex space-x-2 border-b">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="text-lg">{category.name}</span>
              </button>
            ))}
          </div>

          {/* Emoji Grid */}
          <ScrollArea className="h-64">
            <div className="grid grid-cols-8 gap-2">
              {commonEmojis.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => onEmojiSelect(emoji)}
                  className="w-8 h-8 text-lg hover:bg-muted rounded transition-colors flex items-center justify-center"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
} 