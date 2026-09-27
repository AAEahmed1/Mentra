/**
 * Fills an existing account with a realistic term so the app can be judged
 * with content in it, instead of waiting weeks to accumulate real work.
 *
 *   npm run seed:demo -- --email you@example.com
 *   npm run seed:demo -- --email you@example.com --clear
 *
 * Every run REPLACES the account's terms, courses, class times, work, notes
 * and memories: they are deleted first (in one transaction), then the demo
 * term is written.
 * Topping up instead would stack a second copy of everything on the first.
 * `--clear` stops after the delete. Only point it at an account whose data
 * you are willing to lose.
 *
 * It refuses to run unless DATABASE_URL is on this machine, because the same
 * .env line that points at a local database can just as easily point at
 * production. `--allow-remote` overrides that, loudly, for a deliberate seed
 * of a remote demo database.
 *
 * It writes through the same service functions the app uses, so anything it
 * creates has passed the same ownership and validation checks as real input.
 *
 * The account must already exist — sign up in the app first. That keeps
 * password hashing where it belongs (Better Auth) and means this script never
 * creates a way in.
 *
 * Dates are relative to today, so the dashboard always has genuinely overdue,
 * due-now and upcoming work whenever you run it.
 *
 * The student is a nursing student on purpose: Mentra is meant to serve every
 * field, and seeding it with a computing course would quietly bias every
 * screenshot and design judgement that follows.
 */
// Next.js loads .env for the app; a standalone script has to ask for it.
import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import { createSemester } from "../src/lib/services/semester";
import { createCourse } from "../src/lib/services/course";
import { createMeetings } from "../src/lib/services/meeting";
import { createTask } from "../src/lib/services/task";
import { createNote } from "../src/lib/services/note";
import { createMemory } from "../src/lib/services/memory";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

/**
 * The host DATABASE_URL points at, or null when it cannot be read. An
 * unreadable URL is treated as remote: the guard exists for the case nobody
 * checked.
 */
function databaseHost(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * A calendar date `offsetDays` from today, stored as UTC midnight like every
 * due date. "Today" is this machine's local date, not UTC's: the app counts
 * days on the student's own calendar, so seeding at 21:00 in Toronto (already
 * tomorrow in UTC) would otherwise print "due today" work as due tomorrow.
 */
const at = (offsetDays: number) => {
  const now = new Date();
  return new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays)
  );
};

const COURSES = [
  { name: "Clinical Pharmacology", code: "NURS 302", professor: "Adeyemi", credits: 20 },
  { name: "Adult Nursing Practice", code: "NURS 310", professor: "Okonkwo", credits: 20 },
  { name: "Anatomy & Physiology II", code: "BIOL 204", professor: "Lindqvist", credits: 15 },
  { name: "Research Methods for Practice", code: "NURS 285", professor: undefined, credits: 10 },
  { name: "Mental Health Nursing", code: "NURS 320", professor: "Ferreira", credits: 20 },
] as const;

/** courseIndex indexes COURSES; null means the task belongs to no course. */
const TASKS = [
  { title: "Drug calculations worksheet", courseIndex: 0, due: -4, minutes: 75, priority: "medium", type: "assignment" },
  { title: "Reflective log entry", courseIndex: 4, due: -2, minutes: 30, priority: "medium", type: "task" },
  { title: "Ward simulation prep", courseIndex: 1, due: 0, minutes: 45, priority: "high", type: "task" },
  { title: "Cardiac cycle worksheet", courseIndex: 2, due: 2, minutes: 60, priority: "medium", type: "assignment" },
  { title: "Literature search exercise", courseIndex: 3, due: 5, minutes: 90, priority: "low", type: "assignment", status: "in_progress" },
  { title: "Reading: chapters 4 to 6", courseIndex: 2, due: 7, minutes: 50, priority: "low", type: "task" },
  { title: "Pharmacology midterm", courseIndex: 0, due: 13, minutes: 240, priority: "high", type: "exam", topics: "Pharmacokinetics, adverse reactions, dosage calculation" },
  { title: "Care plan case study", courseIndex: 4, due: 15, minutes: 180, priority: "high", type: "assignment" },
  { title: "Placement reflective essay", courseIndex: null, due: 9, minutes: 120, priority: "medium", type: "assignment" },
  { title: "Renew library loans", courseIndex: null, due: null, minutes: 10, priority: "low", type: "task" },
  { title: "Anatomy quiz 1", courseIndex: 2, due: -9, minutes: 40, priority: "medium", type: "quiz", status: "completed", actual: 55 },
  { title: "Pharmacology quiz 2", courseIndex: 0, due: 4, minutes: 30, priority: "medium", type: "quiz" },
] as const;

/** A plausible week: every course meets, one has a lab, nothing overlaps. */
const MEETINGS: {
  courseIndex: number;
  kind: "lecture" | "lab" | "tutorial" | "seminar" | "other";
  weekdays: number[];
  start: string;
  minutes: number;
  location?: string;
}[] = [
  { courseIndex: 0, kind: "lecture", weekdays: [1, 3], start: "09:00", minutes: 80, location: "Hall A" },
  { courseIndex: 1, kind: "lab", weekdays: [2], start: "13:00", minutes: 170, location: "Sim Suite" },
  { courseIndex: 2, kind: "lecture", weekdays: [2, 4], start: "10:30", minutes: 80, location: "Hall B" },
  { courseIndex: 3, kind: "seminar", weekdays: [4], start: "14:00", minutes: 110, location: "Room 3.12" },
  { courseIndex: 4, kind: "tutorial", weekdays: [5], start: "11:00", minutes: 50 },
];

const NOTES = [
  { title: "Dosage formula", courseIndex: 0, body: "Required dose divided by stock dose, multiplied by stock volume. Check units before anything else — most errors in the worked examples came from mg vs mcg, not the arithmetic." },
  { title: "Handover structure", courseIndex: 1, body: "Situation, background, assessment, recommendation. Practising this out loud made the simulation far less stressful than reading it did." },
  { title: "Cardiac cycle in plain terms", courseIndex: 2, body: "Diastole fills, systole empties. The valve sounds are the closures, not the openings — that was the bit I kept getting backwards." },
] as const;

const MEMORIES = [
  { content: "Student is studying Nursing.", type: "profile", source: "explicit" },
  { content: "Student finds dosage calculation harder than the pharmacology theory.", type: "learning_state", source: "inferred" },
  { content: "Student tends to underestimate how long written assignments take.", type: "behavioral", source: "inferred" },
  { content: "Placement runs Tuesdays and Wednesdays, so those evenings are unusable.", type: "commitment", source: "explicit" },
] as const;

async function main() {
  const args = process.argv.slice(2);
  const email = args[args.indexOf("--email") + 1];
  const clear = args.includes("--clear");
  const allowRemote = args.includes("--allow-remote");

  if (!args.includes("--email") || !email || email.startsWith("--")) {
    throw new Error(
      "Pass the account to seed: npm run seed:demo -- --email you@example.com\n" +
        "Seeding replaces that account's terms, courses, work, notes and " +
        "memories; add --clear to only delete them."
    );
  }

  const host = databaseHost(process.env.DATABASE_URL);
  if (!host || !LOCAL_HOSTS.has(host)) {
    if (!allowRemote) {
      throw new Error(
        `DATABASE_URL points at ${host ?? "an unreadable or missing host"}, ` +
          "not this machine. This script deletes the account's data before " +
          "seeding, so it only runs against a local database. Pass " +
          "--allow-remote if you really mean to seed a remote one."
      );
    }
    console.warn("");
    console.warn("!".repeat(72));
    console.warn(`  --allow-remote: seeding a REMOTE database at ${host ?? "?"}.`);
    console.warn(`  All course, work, note and memory data for ${email} there`);
    console.warn("  will be DELETED and replaced. Ctrl+C now if that is wrong.");
    console.warn("!".repeat(72));
    console.warn("");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error(
      `No account for ${email}. Sign up in the app first, then run this again.`
    );
  }

  // Always clear first, so re-running refreshes the term rather than stacking
  // a second copy of it on top of the last one. One transaction, so a failure
  // part-way cannot leave courses whose notes are gone, or the reverse.
  await prisma.$transaction([
    prisma.note.deleteMany({ where: { userId: user.id } }),
    prisma.task.deleteMany({ where: { userId: user.id } }),
    prisma.memory.deleteMany({ where: { userId: user.id } }),
    prisma.course.deleteMany({ where: { semester: { userId: user.id } } }),
    prisma.semester.deleteMany({ where: { userId: user.id } }),
  ]);

  if (clear) {
    console.log(`Cleared all course, work, note and memory data for ${email}.`);
    console.log("The account itself is untouched — you can still sign in.");
    return;
  }

  const semester = await createSemester(user.id, {
    name: "Autumn 2026",
    startDate: at(-24),
    endDate: at(80),
  });

  const courseIds: string[] = [];
  for (const course of COURSES) {
    const created = await createCourse(user.id, semester.id, {
      name: course.name,
      code: course.code,
      professor: course.professor,
      credits: course.credits,
    });
    if (!created.success) throw new Error(`Could not create ${course.name}`);
    courseIds.push(created.data.id);
  }

  for (const meeting of MEETINGS) {
    const [hours, minutes] = meeting.start.split(":").map(Number);
    const created = await createMeetings(user.id, courseIds[meeting.courseIndex], {
      kind: meeting.kind,
      weekdays: meeting.weekdays,
      startMinute: hours * 60 + minutes,
      durationMinutes: meeting.minutes,
      location: meeting.location,
    });
    if (!created.success) throw new Error("Could not seed class times.");
  }

  for (const task of TASKS) {
    const created = await createTask(user.id, {
      title: task.title,
      description: undefined,
      dueDate: task.due === null ? undefined : at(task.due),
      priority: task.priority,
      estimatedDuration: task.minutes,
      type: task.type,
      topicsToReview: "topics" in task ? task.topics : undefined,
      courseId:
        task.courseIndex === null ? undefined : courseIds[task.courseIndex],
    });
    if (!created.success) throw new Error(`Could not create ${task.title}`);

    // createTask always starts a task at not_started, so anything that should
    // look already-underway or finished is moved afterwards.
    if ("status" in task) {
      await prisma.task.update({
        where: { id: created.data.id },
        data: {
          status: task.status,
          ...("actual" in task ? { actualDuration: task.actual } : {}),
        },
      });
    }
  }

  for (const note of NOTES) {
    const created = await createNote(user.id, {
      title: note.title,
      body: note.body,
      courseId: courseIds[note.courseIndex],
    });
    if (!created.success) throw new Error(`Could not create ${note.title}`);
  }

  for (const memory of MEMORIES) {
    await createMemory(user.id, {
      content: memory.content,
      type: memory.type,
      source: memory.source,
    });
  }

  console.log(`Seeded ${email}:`);
  console.log(
    `  1 term, ${COURSES.length} courses, ${MEETINGS.length} weekly class times, ${TASKS.length} pieces of work,`
  );
  console.log(`  ${NOTES.length} notes, ${MEMORIES.length} memories.`);
  console.log("Run again with --clear to remove all of it.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
