"use client";

import { deleteMeetingAction, updateMeetingAction } from "@/lib/actions/meeting";
import {
  describeMeeting,
  formatClockTime,
  MEETING_KINDS,
  MEETING_KIND_LABELS,
  WEEKDAYS,
  type MeetingKindValue,
} from "@/lib/meeting";
import { useInlineEdit, useRowAction } from "@/lib/use-row-actions";
import { ConfirmAction } from "@/components/confirm-action";
import { EditActions, FiledRow, FiledRowEditing, FormErrors } from "@/components/filed-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type Meeting = {
  id: string;
  kind: MeetingKindValue;
  weekday: number;
  startMinute: number;
  durationMinutes: number;
  location: string | null;
};

export function MeetingRow({ meeting }: { meeting: Meeting }) {
  const edit = useInlineEdit(updateMeetingAction);
  const remove = useRowAction(deleteMeetingAction);
  const description = describeMeeting(meeting);

  if (!edit.isEditing) {
    return (
      <FiledRow
        error={remove.error}
        actions={
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`Edit ${description}`}
              onClick={edit.open}
            >
              Edit
            </Button>
            <ConfirmAction
              label="Remove"
              itemName={description}
              onConfirm={() => remove.run("meetingId", meeting.id)}
              isPending={remove.isPending}
            />
          </>
        }
      >
        <p data-figures className="text-sm">
          {description}
        </p>
      </FiledRow>
    );
  }

  const id = (field: string) => `meeting-${field}-${meeting.id}`;

  return (
    <FiledRowEditing>
      <form action={edit.submit} className="flex flex-col gap-3">
        <input type="hidden" name="meetingId" value={meeting.id} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor={id("day")}>Day</Label>
            <Select id={id("day")} name="weekday" defaultValue={String(meeting.weekday)}>
              {WEEKDAYS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.long}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={id("kind")}>Kind</Label>
            <Select id={id("kind")} name="kind" defaultValue={meeting.kind}>
              {MEETING_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {MEETING_KIND_LABELS[kind]}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={id("start")}>Starts</Label>
            <Input
              id={id("start")}
              name="startTime"
              type="time"
              defaultValue={formatClockTime(meeting.startMinute)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={id("duration")}>Minutes</Label>
            <Input
              id={id("duration")}
              name="durationMinutes"
              type="number"
              min={5}
              max={720}
              step={5}
              defaultValue={meeting.durationMinutes}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={id("location")}>Where</Label>
            <Input id={id("location")} name="location" defaultValue={meeting.location ?? ""} />
          </div>
        </div>
        <FormErrors errors={edit.errors} />
        <EditActions isPending={edit.isPending} onCancel={edit.cancel} />
      </form>
    </FiledRowEditing>
  );
}
