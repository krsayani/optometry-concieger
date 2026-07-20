import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JOB_CATEGORIES } from "@/utils/format";

export function JobForm({ initial, submitLabel, onSubmit, busy }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "General");
  const [date, setDate] = useState(initial?.date ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [rate, setRate] = useState(
    initial?.rate != null ? String(initial.rate) : "",
  );
  const [status, setStatus] = useState(initial?.status ?? "Open");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      date: date || null,
      location: location.trim(),
      rate: rate.trim() ? Number(rate) : null,
      status,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Job title</Label>
        <Input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Brand designer for a new product launch"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          required
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the work, deliverables, and what you're looking for…"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {JOB_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Remote, New York, etc."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date ?? ""}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rate">Rate (USD)</Label>
          <Input
            id="rate"
            type="number"
            min="0"
            step="1"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="e.g. 1200"
          />
        </div>
      </div>

      {initial?.id ? (
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="sm:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={busy}
        className="w-full sm:w-auto"
      >
        {busy ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
