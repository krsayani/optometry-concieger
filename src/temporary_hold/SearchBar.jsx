import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JOB_CATEGORIES } from "@/utils/format";

export function SearchBar({
  search,
  category,
  onSearchChange,
  onCategoryChange,
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search jobs by title, keyword or location…"
          className="h-11 border-0 bg-transparent pl-10 shadow-none focus-visible:ring-0"
        />
      </div>
      <Select value={category} onValueChange={onCategoryChange}>
        <SelectTrigger className="h-11 w-full border-border bg-background sm:w-52">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All categories</SelectItem>
          {JOB_CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
