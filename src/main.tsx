import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileCheck2,
  Leaf,
  LockKeyhole,
  Menu,
  Plus,
  Search,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { auditProjection, filterAuditEvents, type AuditEvent } from "./audit";
import {
  bookingReadiness,
  createBookingRequest,
  formatBookingTime,
  type BookingDraft,
  type BookingRequest,
} from "./booking";
import {
  bookableStarts,
  serviceReadiness,
  serviceWindowMinutes,
  updateService,
  type ServiceOffering,
} from "./catalog";
import {
  addCartItem,
  cartTotal,
  setCartQuantity,
  type CartLine,
} from "./commerce";
import {
  appendAuthorizedEntry,
  balance,
  noteReadiness,
  searchItems,
  sign,
  transition,
  type SearchItem,
  type SoapNote,
  type Status,
} from "./domain";
import { flowProgress, upsertFlowAnswer, type FlowAnswer } from "./flows";
import { acknowledgeIntake, intakeChanges, type IntakeProfile } from "./intake";
import {
  percentageChange,
  summarizePractice,
  type VisitSignal,
} from "./insights";
import { moneyTotal, recordRefund, type MoneyEntry } from "./money";
import {
  applyMessageTemplate,
  messageReadiness,
  queueSyntheticMessage,
  type MessageChannel,
  type OutboxMessage,
} from "./messages";
import { searchForView, viewFromSearch } from "./routing";
import { resourceConflicts, type ScheduleBlock } from "./schedule";
import {
  clearEmpressSession,
  useSessionState,
  writeSessionValue,
} from "./session";
import "./styles.css";
import "./enhancements.css";
const nav = [
  "Today",
  "Calendar",
  "Book Online",
  "Clients",
  "Messages",
  "Care",
  "Community Care",
  "Money",
  "Flows",
  "Services",
  "Store",
  "Insights",
  "Practice",
];
const people = ["Maya Rivers", "Jon Bell", "Alex Morgan", "Sam Lee"];
function App() {
  const [view, setView] = useState(() =>
    viewFromSearch(window.location.search, nav),
  );
  const [privacy, setPrivacy] = useSessionState("app:privacy", false);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  useEffect(() => {
    const sync = () => setView(viewFromSearch(window.location.search, nav));
    const shortcut = (event: KeyboardEvent) => {
      if (
        event.key === "/" &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement)
      ) {
        event.preventDefault();
        setSearching(true);
      }
    };
    window.addEventListener("popstate", sync);
    window.addEventListener("keydown", shortcut);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("keydown", shortcut);
    };
  }, []);
  const go = (next: string) => {
    if (next !== view) window.history.pushState(null, "", searchForView(next));
    setView(next);
    setOpen(false);
    setSearching(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <div>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <aside className={open ? "open" : ""}>
        <div className="brand">
          <b>E</b>
          <span>
            EMPRESS<small>Practice care, in flow</small>
          </span>
        </div>
        <nav aria-label="Primary">
          {nav.map((n) => (
            <button
              className={view === n ? "active" : ""}
              onClick={() => go(n)}
              key={n}
            >
              {n}
            </button>
          ))}
        </nav>
        <div className="demo">
          <span>EM · Synthetic practice</span>
          <button
            onClick={() => {
              clearEmpressSession();
              window.location.reload();
            }}
          >
            Reset synthetic session
          </button>
        </div>
      </aside>
      {open && (
        <button
          className="scrim"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <main id="main">
        <header>
          <button
            className="menu"
            aria-label="Open navigation"
            onClick={() => setOpen(!open)}
          >
            <Menu />
          </button>
          <div>
            <small>Wednesday, July 22</small>
            <h1>{view}</h1>
          </div>
          <div className="tools">
            <button onClick={() => setPrivacy(!privacy)}>
              <LockKeyhole size={16} /> Privacy {privacy ? "on" : "off"}
            </button>
            <button
              className="search-button"
              aria-label="Search Empress"
              title="Search · /"
              onClick={() => setSearching(true)}
            >
              <Search size={19} />
            </button>
            <b>ER</b>
          </div>
        </header>
        <Route view={view} privacy={privacy} onGo={go} />
      </main>
      {searching && (
        <SearchDialog
          privacy={privacy}
          onClose={() => setSearching(false)}
          onGo={go}
        />
      )}
    </div>
  );
}
const searchData: SearchItem[] = [
  ...nav.map((label) => ({
    label,
    kind: "Page",
    view: label,
    keywords:
      label === "Calendar"
        ? "schedule appointment availability"
        : label === "Care"
          ? "notes body map soap"
          : label,
  })),
  ...people.map((label, i) => ({
    label,
    kind: "Client",
    view: "Clients",
    keywords: `EMP-${1024 + i} ${i === 2 ? "Community Care" : "Cash pay"}`,
  })),
];
function SearchDialog({
  privacy,
  onClose,
  onGo,
}: {
  privacy: boolean;
  onClose: () => void;
  onGo: (view: string) => void;
}) {
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    input.current?.focus();
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);
  const results = searchItems(searchData, q);
  return (
    <div
      className="dialog-layer"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="search-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-title"
      >
        <div className="search-head">
          <Search />
          <div>
            <small id="search-title">SEARCH EMPRESS</small>
            <input
              ref={input}
              aria-label="Search pages and synthetic clients"
              placeholder="Try “Maya” or “appointments”"
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
          </div>
          <button aria-label="Close search" onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="search-results" aria-live="polite">
          {results.length ? (
            results.map((item, index) => (
              <button
                key={`${item.kind}-${item.label}`}
                onClick={() => onGo(item.view)}
              >
                <span className="result-icon">
                  {item.kind === "Client" ? "ER" : "→"}
                </span>
                <span>
                  <b>
                    {privacy && item.kind === "Client"
                      ? `Synthetic client ${index + 1}`
                      : item.label}
                  </b>
                  <small>
                    {item.kind}
                    {item.kind === "Client"
                      ? ` · ${item.keywords?.split(" ")[0]}`
                      : ""}
                  </small>
                </span>
                <ChevronRight />
              </button>
            ))
          ) : (
            <div className="empty">
              <b>No matches</b>
              <p>Try a client name, page, or task such as “notes.”</p>
            </div>
          )}
        </div>
        <p className="search-foot">
          <LockKeyhole size={13} /> Results respect clinic scope and privacy
          mode.
        </p>
      </section>
    </div>
  );
}
function Route({
  view,
  privacy,
  onGo,
}: {
  view: string;
  privacy: boolean;
  onGo: (view: string) => void;
}) {
  if (view === "Today")
    return (
      <Today
        privacy={privacy}
        onPrepare={() => onGo("Care")}
        onMessage={() => onGo("Messages")}
      />
    );
  if (view === "Calendar") return <Calendar privacy={privacy} />;
  if (view === "Book Online") return <OnlineBooking />;
  if (view === "Clients")
    return (
      <Clients
        privacy={privacy}
        onPrepare={() => onGo("Care")}
        onMessage={(index) => {
          writeSessionValue("messages:selected-client", index);
          writeSessionValue(
            "messages:channel",
            messageClients[index].consent.sms ? "sms" : "email",
          );
          writeSessionValue("messages:draft", "");
          onGo("Messages");
        }}
      />
    );
  if (view === "Messages") return <Messages privacy={privacy} />;
  if (view === "Care") return <Care privacy={privacy} />;
  if (view === "Community Care") return <Community />;
  if (view === "Money") return <Money />;
  if (view === "Flows") return <Flows />;
  if (view === "Services") return <Services />;
  if (view === "Store") return <Store />;
  if (view === "Insights") return <Insights />;
  return <Practice />;
}
function Shell({
  tag,
  title,
  copy,
  children,
}: {
  tag: string;
  title: string;
  copy: string;
  children: React.ReactNode;
}) {
  return (
    <div className="content">
      <section className="intro">
        <small>{tag}</small>
        <h2>{title}</h2>
        <p>{copy}</p>
      </section>
      {children}
      <p className="safety">
        <ShieldCheck size={15} /> Synthetic practice mode · no real PHI,
        Veteran, or payment data
      </p>
    </div>
  );
}
function Today({
  privacy,
  onPrepare,
  onMessage,
}: {
  privacy: boolean;
  onPrepare: () => void;
  onMessage: () => void;
}) {
  const [visitStatus, setVisitStatus] = useSessionState<Status>(
    "today:visit-status",
    "confirmed",
  );
  const [tasks, setTasks] = useSessionState("today:tasks", [
    {
      id: "intake",
      label: "Review intake update",
      detail: "Jon Bell · before 10:30",
      done: false,
    },
    {
      id: "note",
      label: "Finish draft note",
      detail: "Sam Lee · yesterday",
      done: false,
    },
    {
      id: "rfs",
      label: "Prepare continuation request",
      detail: "Alex Morgan · 4 visits remain",
      done: false,
    },
  ]);
  const remaining = tasks.filter((task) => !task.done).length;
  const advance = () => {
    if (visitStatus === "confirmed")
      setVisitStatus(transition(visitStatus, "checked_in"));
    else if (visitStatus === "checked_in")
      setVisitStatus(transition(visitStatus, "in_service"));
    else onPrepare();
  };
  const action =
    visitStatus === "confirmed"
      ? "Check in client"
      : visitStatus === "checked_in"
        ? "Begin visit"
        : "Open encounter";
  const label =
    visitStatus === "confirmed"
      ? "Confirmed"
      : visitStatus === "checked_in"
        ? "Checked in"
        : "In service";
  return (
    <Shell
      tag="GOOD MORNING, ELENA"
      title="Your day has a gentle rhythm."
      copy={`Four appointments and ${remaining} ${remaining === 1 ? "task" : "tasks"} need attention.`}
    >
      <div className="cols today-top">
        <section className="card next-visit">
          <div className="section-heading">
            <small>
              {visitStatus === "in_service"
                ? "CURRENT VISIT"
                : "UP NEXT · IN 42 MIN"}
            </small>
            <span>{label}</span>
          </div>
          <h3>{privacy ? "Client hidden" : "Maya Rivers"}</h3>
          <p>9:00–10:00 · Restore Flow</p>
          <dl>
            <dt>Today’s intention</dt>
            <dd>Release shoulder tension and settle into the week.</dd>
            <dt>Comfort</dt>
            <dd>Moderate pressure · Unscented · Bolster under knees</dd>
          </dl>
          <button className="primary" onClick={advance}>
            {action} <ChevronRight />
          </button>
        </section>
        <section className="card task-card">
          <div className="section-heading">
            <div>
              <small>NEEDS ATTENTION</small>
              <h3>{remaining} remaining</h3>
            </div>
            <span>
              {tasks.length - remaining}/{tasks.length} done
            </span>
          </div>
          {tasks.map((task) => (
            <div
              className={`task-row ${task.done ? "done" : ""}`}
              key={task.id}
            >
              <button
                aria-label={`${task.done ? "Reopen" : "Complete"} ${task.label}`}
                onClick={() =>
                  setTasks((current) =>
                    current.map((item) =>
                      item.id === task.id
                        ? { ...item, done: !item.done }
                        : item,
                    ),
                  )
                }
              >
                {task.done ? "✓" : ""}
              </button>
              <span>
                <b>{task.label}</b>
                <small>{task.detail}</small>
              </span>
            </div>
          ))}
          <button className="queue-link" onClick={onMessage}>
            <Send size={14} /> Open client communication queue
          </button>
          {!remaining && (
            <div className="all-clear">
              <CheckCircle2 />
              <span>
                <b>All caught up</b>Your attention queue is clear.
              </span>
            </div>
          )}
        </section>
      </div>
      <section className="card wide">
        <div className="section-heading">
          <div>
            <small>WEDNESDAY · 4 VISITS</small>
            <h3>Today’s rhythm</h3>
          </div>
          <span>Willow room</span>
        </div>
        {people.map((person, index) => (
          <div className="appt" key={person}>
            <time>{["9:00", "10:30", "1:00", "2:30"][index]}</time>
            <span className="dot" />
            <b>{privacy ? "Client hidden" : person}</b>
            <small>
              {index === 2 ? "Community Care Massage" : "Restore Flow"}
            </small>
            <span className={`pill ${index === 0 ? "current" : ""}`}>
              {index === 0 ? label : index === 1 ? "Intake update" : "Ready"}
            </span>
          </div>
        ))}
      </section>
    </Shell>
  );
}
const calendarDays = [
  { day: "WED", date: "22", label: "July 22" },
  { day: "THU", date: "23", label: "July 23" },
  { day: "FRI", date: "24", label: "July 24" },
  { day: "SAT", date: "25", label: "July 25" },
  { day: "SUN", date: "26", label: "July 26" },
];
const calendarTimes = [
  { time: "9:00", start: 540 },
  { time: "10:30", start: 630 },
  { time: "11:30", start: 690 },
  { time: "1:00", start: 780 },
  { time: "2:30", start: 870 },
];
function Calendar({ privacy }: { privacy: boolean }) {
  const [day, setDay] = useSessionState("calendar:day", 0);
  const [slot, setSlot] = useSessionState("calendar:slot", "10:30");
  const [status, setStatus] = useSessionState<Status | null>(
    "calendar:status",
    null,
  );
  const [client, setClient] = useSessionState("calendar:client", people[0]);
  const [therapist, setTherapist] = useSessionState(
    "calendar:therapist",
    "Elena",
  );
  const [room, setRoom] = useSessionState("calendar:room", "Willow");
  const [services] = useSessionState<ServiceOffering[]>(
    "services:catalog",
    defaultServices,
  );
  const activeServices = services.filter((service) => service.active);
  const [serviceId, setServiceId] = useSessionState(
    "calendar:service",
    activeServices[0]?.id ?? defaultServices[0].id,
  );
  const service =
    activeServices.find((offering) => offering.id === serviceId) ??
    activeServices[0] ??
    defaultServices[0];
  const blocks: ScheduleBlock[] =
    day === 0
      ? [
          {
            id: "maya",
            start: 540,
            end: 600,
            therapist: "Elena",
            room: "Willow",
            kind: "appointment",
          },
          {
            id: "reset",
            start: 690,
            end: 735,
            therapist: "Elena",
            room: "Willow",
            kind: "buffer",
          },
          {
            id: "alex",
            start: 780,
            end: 840,
            therapist: "Elena",
            room: "Willow",
            kind: "appointment",
          },
        ]
      : day === 1
        ? [
            {
              id: "jon",
              start: 630,
              end: 690,
              therapist: "Elena",
              room: "Willow",
              kind: "appointment",
            },
            {
              id: "reset",
              start: 870,
              end: 900,
              therapist: "Elena",
              room: "Willow",
              kind: "buffer",
            },
          ]
        : day === 2
          ? [
              {
                id: "sam",
                start: 540,
                end: 600,
                therapist: "Elena",
                room: "Willow",
                kind: "appointment",
              },
            ]
          : [];
  const slotState = (start: number) => {
    const conflicts = resourceConflicts(
      { start, end: start + serviceWindowMinutes(service), therapist, room },
      blocks,
    );
    return conflicts.some((item) => item.kind === "buffer")
      ? "buffer"
      : conflicts.length
        ? "booked"
        : "available";
  };
  const selectedTime = calendarTimes.find((item) => item.time === slot)!;
  const selectedState = slotState(selectedTime.start);
  const choose = (time: string) => {
    setSlot(time);
    setStatus(null);
  };
  const selectDay = (index: number) => {
    setDay(index);
    setSlot("10:30");
    setStatus(null);
  };
  const hold = () => {
    if (selectedState === "available") setStatus("held");
  };
  const confirm = () =>
    setStatus((current) =>
      current ? transition(current, "confirmed") : current,
    );
  const available = calendarTimes.filter(
    (item) => slotState(item.start) === "available",
  ).length;
  return (
    <Shell
      tag={`CALENDAR · ${calendarDays[day].label.toUpperCase()}`}
      title="A conflict-safe week"
      copy="Move across the week while therapist, room, appointment, and protected-buffer conflicts are evaluated together."
    >
      <section className="week-strip" aria-label="Calendar dates">
        {calendarDays.map((item, index) => (
          <button
            className={day === index ? "selected" : ""}
            aria-pressed={day === index}
            onClick={() => selectDay(index)}
            key={item.date}
          >
            <small>{item.day}</small>
            <b>{item.date}</b>
            <span>
              {index === 0
                ? "Today"
                : index === 3 || index === 4
                  ? "Limited"
                  : "Open"}
            </span>
          </button>
        ))}
      </section>
      <div className="calendar-tools">
        <div>
          <label>
            <span>Therapist</span>
            <select
              aria-label="Therapist"
              value={therapist}
              onChange={(event) => {
                setTherapist(event.target.value);
                setStatus(null);
              }}
            >
              <option>Elena</option>
              <option>Noor</option>
            </select>
          </label>
          <label>
            <span>Room</span>
            <select
              aria-label="Room"
              value={room}
              onChange={(event) => {
                setRoom(event.target.value);
                setStatus(null);
              }}
            >
              <option>Willow</option>
              <option>Cedar</option>
            </select>
          </label>
        </div>
        <span>
          <b>{available}</b> available times
        </span>
      </div>
      <div className="cols calendar-layout">
        <section className="card schedule" aria-label="Appointment times">
          {calendarTimes.map((item) => {
            const state = slotState(item.start);
            return (
              <button
                className={"slot " + (slot === item.time ? "selected" : "")}
                aria-pressed={slot === item.time}
                onClick={() => choose(item.time)}
                key={item.time}
              >
                <b>{item.time}</b>
                <span>
                  {state === "booked"
                    ? privacy
                      ? "Booked · hidden"
                      : "Booked · synthetic client"
                    : state === "buffer"
                      ? "Protected resource buffer"
                      : `Available · ${service.durationMinutes} minutes`}
                </span>
                <span className={`availability ${state}`}>{state}</span>
              </button>
            );
          })}
        </section>
        <section className="card booking-card">
          <small>
            NEW APPOINTMENT · {calendarDays[day].label.toUpperCase()}
          </small>
          {status === "confirmed" ? (
            <div className="confirmation">
              <CheckCircle2 />
              <small>APPOINTMENT CONFIRMED</small>
              <h3>
                {slot} · {service.name}
              </h3>
              <p>
                {privacy ? "Synthetic client" : client}
                <br />
                {therapist} · {room} room
                <br />
                {calendarDays[day].label} · {service.durationMinutes} minutes
              </p>
              <button onClick={() => setStatus(null)}>Schedule another</button>
            </div>
          ) : (
            <>
              <h3>
                {slot} · {service.name}
              </h3>
              <label className="field">
                <span>Service</span>
                <select
                  aria-label="Service"
                  value={service.id}
                  onChange={(event) => {
                    setServiceId(event.target.value);
                    setStatus(null);
                  }}
                >
                  {activeServices.map((offering) => (
                    <option value={offering.id} key={offering.id}>
                      {offering.name} · {offering.durationMinutes} min
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Client</span>
                <select
                  value={client}
                  onChange={(event) => setClient(event.target.value)}
                >
                  {people.map((person) => (
                    <option key={person}>{person}</option>
                  ))}
                </select>
              </label>
              <div className="checks">
                <p>✓ {therapist} selected</p>
                <p>✓ {room} room selected</p>
                <p>
                  ✓ {service.durationMinutes} min + {service.bufferMinutes} min
                  buffer
                </p>
              </div>
              {selectedState !== "available" ? (
                <p className="conflict" role="status">
                  <b>
                    {selectedState === "booked"
                      ? "Resource conflict"
                      : "Required resource buffer"}
                  </b>
                  <span>
                    {selectedState === "booked"
                      ? "The therapist or room is already occupied at this time."
                      : "This protected reset period cannot be booked."}
                  </span>
                </p>
              ) : status === "held" ? (
                <p className="hold" role="status">
                  <Clock3 />
                  <span>
                    <b>Held for 5 minutes</b>Review the date and resources, then
                    confirm.
                  </span>
                </p>
              ) : (
                <p className="notice">
                  This combination is available. The server rechecks all
                  resources before confirmation.
                </p>
              )}
              {status === "held" ? (
                <div className="button-stack">
                  <button className="primary" onClick={confirm}>
                    Confirm appointment
                  </button>
                  <button onClick={() => setStatus(null)}>Release hold</button>
                </div>
              ) : (
                <button
                  className="primary"
                  disabled={selectedState !== "available"}
                  onClick={hold}
                >
                  Hold this slot
                </button>
              )}
            </>
          )}
        </section>
      </div>
    </Shell>
  );
}
const bookingDates = [
  { value: "2026-07-24", day: "FRI", date: "24", label: "July 24" },
  { value: "2026-07-25", day: "SAT", date: "25", label: "July 25" },
  { value: "2026-07-27", day: "MON", date: "27", label: "July 27" },
];
const bookingTimes = [540, 630, 780, 870];
const emptyBooking: BookingDraft = {
  serviceId: "restore",
  date: "2026-07-24",
  startMinutes: null,
  firstName: "",
  email: "",
  acceptsPolicy: false,
};
function OnlineBooking() {
  const [services] = useSessionState<ServiceOffering[]>(
    "services:catalog",
    defaultServices,
  );
  const activeServices = services.filter((service) => service.active);
  const [draft, setDraft] = useSessionState<BookingDraft>(
    "booking:draft",
    emptyBooking,
  );
  const [step, setStep] = useSessionState("booking:step", 0);
  const [requests, setRequests] = useSessionState<BookingRequest[]>(
    "booking:requests",
    [],
  );
  const [receiptId, setReceiptId] = useSessionState<string | null>(
    "booking:receipt",
    null,
  );
  const service =
    activeServices.find((offering) => offering.id === draft.serviceId) ??
    activeServices[0] ??
    defaultServices[0];
  const issues = bookingReadiness(draft);
  const request = () => {
    const id = `BOOK-${String(requests.length + 1042).padStart(4, "0")}`;
    setRequests((current) =>
      createBookingRequest(current, draft, id, new Date().toISOString()),
    );
    setReceiptId(id);
  };
  const restart = () => {
    setDraft({
      ...emptyBooking,
      serviceId: activeServices[0]?.id ?? "restore",
    });
    setStep(0);
    setReceiptId(null);
  };
  if (receiptId) {
    const receipt = requests.find((item) => item.id === receiptId);
    return (
      <Shell
        tag="ONLINE BOOKING · SYNTHETIC"
        title="Your request is in"
        copy="The practice will review the appointment details before the time is confirmed."
      >
        <section className="card booking-receipt">
          <CheckCircle2 />
          <small>REQUEST RECEIVED · {receiptId}</small>
          <h3>{service.name}</h3>
          <p>
            {bookingDates.find((date) => date.value === draft.date)?.label} ·{" "}
            {draft.startMinutes !== null
              ? formatBookingTime(draft.startMinutes)
              : ""}
            <br />
            {service.durationMinutes} minutes · $
            {(service.priceCents / 100).toFixed(2)}
          </p>
          <div className="booking-next">
            <Clock3 />
            <span>
              <b>
                {receipt?.status === "confirmed"
                  ? "Confirmed by the practice"
                  : "Awaiting practice confirmation"}
              </b>
              <small>
                No real email or payment was sent in this synthetic flow.
              </small>
            </span>
          </div>
          <button onClick={restart}>Start another request</button>
        </section>
      </Shell>
    );
  }
  return (
    <Shell
      tag="ONLINE BOOKING · CLIENT PREVIEW"
      title="Make space for care"
      copy="A calm, minimum-necessary booking request that uses the practice’s active services and protected reset times."
    >
      <div
        className="booking-progress"
        aria-label={`Booking step ${step + 1} of 3`}
      >
        {["Service", "Time", "Details"].map((label, index) => (
          <span className={index <= step ? "active" : ""} key={label}>
            <b>{index + 1}</b>
            {label}
          </span>
        ))}
      </div>
      <section className="card public-booking">
        {step === 0 && (
          <>
            <div className="section-heading">
              <div>
                <small>STEP 1 OF 3</small>
                <h3>Choose your care</h3>
              </div>
              <Leaf />
            </div>
            <div className="booking-services">
              {activeServices.map((offering) => (
                <button
                  className={draft.serviceId === offering.id ? "selected" : ""}
                  aria-pressed={draft.serviceId === offering.id}
                  onClick={() => setDraft({ ...draft, serviceId: offering.id })}
                  key={offering.id}
                >
                  <span>
                    <b>{offering.name}</b>
                    <small>
                      {offering.durationMinutes} minutes ·{" "}
                      {offering.channel === "both"
                        ? "Studio or mobile"
                        : offering.channel}
                    </small>
                  </span>
                  <strong>${(offering.priceCents / 100).toFixed(0)}</strong>
                </button>
              ))}
            </div>
            <button className="primary" onClick={() => setStep(1)}>
              Choose a time <ChevronRight />
            </button>
          </>
        )}
        {step === 1 && (
          <>
            <div className="section-heading">
              <div>
                <small>STEP 2 OF 3</small>
                <h3>Find a gentle opening</h3>
              </div>
              <span>{service.durationMinutes} min</span>
            </div>
            <div className="booking-days">
              {bookingDates.map((date) => (
                <button
                  className={draft.date === date.value ? "selected" : ""}
                  aria-pressed={draft.date === date.value}
                  onClick={() =>
                    setDraft({ ...draft, date: date.value, startMinutes: null })
                  }
                  key={date.value}
                >
                  <small>{date.day}</small>
                  <b>{date.date}</b>
                </button>
              ))}
            </div>
            <div className="booking-times" aria-label="Available times">
              {bookingTimes.map((time) => (
                <button
                  className={draft.startMinutes === time ? "selected" : ""}
                  aria-pressed={draft.startMinutes === time}
                  onClick={() => setDraft({ ...draft, startMinutes: time })}
                  key={time}
                >
                  {formatBookingTime(time)}
                </button>
              ))}
            </div>
            <div className="booking-actions">
              <button onClick={() => setStep(0)}>Back</button>
              <button
                className="primary"
                disabled={draft.startMinutes === null}
                onClick={() => setStep(2)}
              >
                Continue <ChevronRight />
              </button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <div className="section-heading">
              <div>
                <small>STEP 3 OF 3</small>
                <h3>How should we follow up?</h3>
              </div>
              <span>Secure request</span>
            </div>
            <div className="booking-summary">
              <b>{service.name}</b>
              <span>
                {bookingDates.find((date) => date.value === draft.date)?.label}{" "}
                ·{" "}
                {draft.startMinutes !== null
                  ? formatBookingTime(draft.startMinutes)
                  : ""}
              </span>
            </div>
            <div className="booking-contact">
              <label className="field">
                <span>First name</span>
                <input
                  autoComplete="given-name"
                  value={draft.firstName}
                  onChange={(event) =>
                    setDraft({ ...draft, firstName: event.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={draft.email}
                  onChange={(event) =>
                    setDraft({ ...draft, email: event.target.value })
                  }
                />
              </label>
            </div>
            <label className="attestation">
              <input
                type="checkbox"
                checked={draft.acceptsPolicy}
                onChange={(event) =>
                  setDraft({ ...draft, acceptsPolicy: event.target.checked })
                }
              />
              <span>
                <b>I accept the synthetic booking policy</b>
                <small>
                  This request is not confirmed until the practice reviews it.
                </small>
              </span>
            </label>
            {issues.length > 0 && (draft.firstName || draft.email) && (
              <p className="message-issue" role="status">
                {issues.join(" · ")}
              </p>
            )}
            <div className="booking-actions">
              <button onClick={() => setStep(1)}>Back</button>
              <button
                className="primary"
                disabled={issues.length > 0}
                onClick={request}
              >
                Request appointment
              </button>
            </div>
          </>
        )}
      </section>
    </Shell>
  );
}
const clientRecords = people.map((name, index) => ({
  name,
  id: `EMP-${1024 + index}`,
  payer: index === 2 ? "Community Care" : "Cash pay",
  next: index % 2 ? "July 29 · 10:30 AM" : "July 24 · 9:00 AM",
  pressure: index === 1 ? "Light" : "Moderate",
  focus: index === 1 ? "Neck and shoulders" : "Bilateral shoulders",
}));
function Clients({
  privacy,
  onPrepare,
  onMessage,
}: {
  privacy: boolean;
  onPrepare: () => void;
  onMessage: (index: number) => void;
}) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(0);
  const [tab, setTab] = useState<"overview" | "history" | "intake">("overview");
  const [acknowledged, setAcknowledged] = useSessionState<number[]>(
    "clients:acknowledged-intake",
    [],
  );
  const matches = clientRecords
    .map((client, index) => ({ client, index }))
    .filter(({ client }) =>
      `${client.name} ${client.id}`.toLowerCase().includes(q.toLowerCase()),
    );
  const client = clientRecords[selected];
  const previous: IntakeProfile = {
    pressure: "Moderate",
    scent: "Unscented",
    positioning: "Bolster under knees",
    focus: "Bilateral shoulders",
  };
  const current: IntakeProfile =
    selected === 1
      ? { ...previous, pressure: "Light", focus: "Neck and shoulders" }
      : previous;
  const changes = intakeChanges(previous, current);
  const pending = changes.length > 0 && !acknowledged.includes(selected);
  const acknowledge = () => {
    acknowledgeIntake(changes, new Date().toISOString());
    setAcknowledged((value) => [...value, selected]);
  };
  const displayName = privacy ? `Client ${client.id}` : client.name;
  return (
    <Shell
      tag="CLIENTS · CLINIC SCOPED"
      title="Continuity without overexposure"
      copy="Review identity, visit history, and client-submitted changes through a minimum-necessary clinic view."
    >
      <div className="clients-layout">
        <aside className="card client-list">
          <label className="client-search">
            <Search size={16} />
            <input
              aria-label="Search synthetic clients"
              placeholder="Search name or ID"
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
          </label>
          <div className="client-list-head">
            <span>{matches.length} clients</span>
            <span>Willow clinic</span>
          </div>
          {matches.map(({ client: item, index }) => (
            <button
              className={selected === index ? "selected" : ""}
              aria-pressed={selected === index}
              onClick={() => {
                setSelected(index);
                setTab("overview");
              }}
              key={item.id}
            >
              <span className="client-avatar">
                {privacy
                  ? "•"
                  : item.name
                      .split(" ")
                      .map((word) => word[0])
                      .join("")}
              </span>
              <span>
                <b>{privacy ? "Client hidden" : item.name}</b>
                <small>
                  {item.id} · {item.payer}
                </small>
              </span>
              {index === 1 && !acknowledged.includes(1) && <em>Updated</em>}
            </button>
          ))}
        </aside>
        <section className="card client-workspace">
          <div className="client-profile-head">
            <div className="client-avatar large">
              {privacy
                ? "•"
                : client.name
                    .split(" ")
                    .map((word) => word[0])
                    .join("")}
            </div>
            <div>
              <small>
                {client.id} · {client.payer}
              </small>
              <h3>{displayName}</h3>
              <span>Active client · Willow clinic</span>
            </div>
            <div className="client-actions">
              <button onClick={() => onMessage(selected)}>
                <Send size={14} /> Message
              </button>
              <button className="primary" onClick={onPrepare}>
                Prepare visit <ChevronRight size={15} />
              </button>
            </div>
          </div>
          <div
            className="client-tabs"
            role="tablist"
            aria-label="Client record sections"
          >
            {(["overview", "history", "intake"] as const).map((value) => (
              <button
                role="tab"
                aria-selected={tab === value}
                className={tab === value ? "selected" : ""}
                onClick={() => setTab(value)}
                key={value}
              >
                {value === "intake" && pending ? <span /> : null}
                {value[0].toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
          {tab === "overview" ? (
            <div className="client-overview">
              <div className="client-metrics">
                <div>
                  <small>NEXT VISIT</small>
                  <b>{client.next}</b>
                  <span>Restore Flow · Willow room</span>
                </div>
                <div>
                  <small>VISITS</small>
                  <b>{3 + selected} completed</b>
                  <span>Last visit · July 15</span>
                </div>
                <div>
                  <small>STATUS</small>
                  <b>
                    {selected === 2 ? "4 visits remain" : "Ready for visit"}
                  </b>
                  <span>{client.payer}</span>
                </div>
              </div>
              <div className="preference-panel">
                <div className="section-heading">
                  <div>
                    <small>CARE PREFERENCES</small>
                    <h3>Continuity cues</h3>
                  </div>
                  <span>Client confirmed</span>
                </div>
                <dl>
                  <dt>Pressure</dt>
                  <dd>{client.pressure}</dd>
                  <dt>Scent</dt>
                  <dd>Unscented</dd>
                  <dt>Positioning</dt>
                  <dd>Bolster under knees</dd>
                  <dt>Focus</dt>
                  <dd>{client.focus}</dd>
                  <dt>Communication</dt>
                  <dd>Verbal check-in</dd>
                  <dt>No-touch regions</dt>
                  <dd>None recorded</dd>
                </dl>
              </div>
            </div>
          ) : tab === "history" ? (
            <div className="visit-history">
              <div className="history-row">
                <time>JUL 15</time>
                <span className="dot" />
                <div>
                  <b>Restore Flow · Completed</b>
                  <small>60 minutes · Elena Ruiz · Signed note v1</small>
                </div>
                <button>View note</button>
              </div>
              <div className="history-row">
                <time>JUL 08</time>
                <span className="dot" />
                <div>
                  <b>Restore Flow · Completed</b>
                  <small>60 minutes · Elena Ruiz · Signed note v1</small>
                </div>
                <button>View note</button>
              </div>
              <div className="history-row">
                <time>JUN 28</time>
                <span className="dot" />
                <div>
                  <b>Initial visit · Completed</b>
                  <small>75 minutes · Elena Ruiz · Intake reviewed</small>
                </div>
                <button>View note</button>
              </div>
            </div>
          ) : (
            <div className="intake-review">
              <div className="section-heading">
                <div>
                  <small>CLIENT-SUBMITTED INTAKE</small>
                  <h3>
                    {changes.length ? "Review changes" : "No new changes"}
                  </h3>
                </div>
                <span className={pending ? "draft" : "ready"}>
                  {pending ? "Needs review" : "Current"}
                </span>
              </div>
              {changes.length ? (
                <>
                  <p>
                    The client updated {changes.length} answers on July 21 at
                    6:42 PM.
                  </p>
                  <div className="change-list">
                    {changes.map((change) => (
                      <div key={change.field}>
                        <b>
                          {change.field[0].toUpperCase() +
                            change.field.slice(1)}
                        </b>
                        <span>
                          <del>{change.previous}</del>
                          <ChevronRight size={14} />
                          <ins>{change.next}</ins>
                        </span>
                      </div>
                    ))}
                  </div>
                  <label className="attestation">
                    <input
                      type="checkbox"
                      checked={!pending}
                      disabled={!pending}
                      onChange={acknowledge}
                    />
                    <span>
                      <b>
                        {pending
                          ? "I reviewed these changes"
                          : "Changes acknowledged"}
                      </b>
                      <small>
                        {pending
                          ? "Update care preparation after review."
                          : "Recorded in this synthetic session."}
                      </small>
                    </span>
                  </label>
                </>
              ) : (
                <div className="all-clear">
                  <CheckCircle2 />
                  <span>
                    <b>Intake is current</b>No client-submitted changes require
                    review.
                  </span>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </Shell>
  );
}
const messageClients = clientRecords.map((client, index) => ({
  ...client,
  consent: {
    sms: index !== 1,
    email: index !== 3,
  },
  contact: index === 1 ? "j•••@example.test" : "(***) ***-01" + (24 + index),
  lastMessage:
    index === 0
      ? "Thank you — Friday works for me."
      : index === 1
        ? "Intake update received."
        : "Appointment reminder delivered.",
}));
const messageTemplates = [
  {
    label: "Appointment reminder",
    body: "Hi {first}, a reminder that your Empress appointment is {date} at {time}. Reply C to confirm.",
  },
  {
    label: "Intake follow-up",
    body: "Hi {first}, please review your synthetic intake before your appointment on {date}.",
  },
  {
    label: "Care follow-up",
    body: "Hi {first}, checking in after your visit. Reply if you need help with your care plan.",
  },
];
function Messages({ privacy }: { privacy: boolean }) {
  const [selected, setSelected] = useSessionState(
    "messages:selected-client",
    0,
  );
  const [channel, setChannel] = useSessionState<MessageChannel>(
    "messages:channel",
    "sms",
  );
  const [body, setBody] = useSessionState("messages:draft", "");
  const [outbox, setOutbox] = useSessionState<OutboxMessage[]>(
    "messages:outbox",
    [],
  );
  const client = messageClients[selected];
  const draft = { clientId: client.id, channel, body };
  const issues = messageReadiness(draft, client.consent);
  const queuedForClient = outbox.filter(
    (message) => message.clientId === client.id,
  );
  const chooseTemplate = (template: string) =>
    setBody(
      applyMessageTemplate(template, {
        first: client.name.split(" ")[0],
        date: "Friday, July 24",
        time: "9:00 AM",
      }),
    );
  const queue = () => {
    setOutbox((messages) =>
      queueSyntheticMessage(
        messages,
        draft,
        client.consent,
        `MSG-${String(messages.length + 1).padStart(4, "0")}`,
        new Date().toISOString(),
      ),
    );
    setBody("");
  };
  return (
    <Shell
      tag="MESSAGES · CONSENT AWARE"
      title="Reach out without losing context"
      copy="Prepare appointment and care follow-ups through synthetic channels that honor each client’s recorded communication consent."
    >
      <div className="message-layout">
        <aside className="card message-list">
          <div className="section-heading">
            <div>
              <small>CONVERSATIONS</small>
              <h3>Client messages</h3>
            </div>
            <span>{outbox.length} queued</span>
          </div>
          {messageClients.map((item, index) => (
            <button
              className={selected === index ? "selected" : ""}
              aria-pressed={selected === index}
              onClick={() => {
                setSelected(index);
                setBody("");
                setChannel(item.consent.sms ? "sms" : "email");
              }}
              key={item.id}
            >
              <span className="client-avatar">
                {privacy
                  ? "•"
                  : item.name
                      .split(" ")
                      .map((word) => word[0])
                      .join("")}
              </span>
              <span>
                <b>{privacy ? `Client ${item.id}` : item.name}</b>
                <small>{item.lastMessage}</small>
              </span>
              {outbox.some((message) => message.clientId === item.id) && (
                <em>Queued</em>
              )}
            </button>
          ))}
        </aside>
        <section className="card message-workspace">
          <div className="message-recipient">
            <div>
              <small>RECIPIENT · {client.id}</small>
              <h3>{privacy ? "Client hidden" : client.name}</h3>
              <span>{client.contact}</span>
            </div>
            <label>
              <span>Channel</span>
              <select
                aria-label="Message channel"
                value={channel}
                onChange={(event) =>
                  setChannel(event.target.value as MessageChannel)
                }
              >
                <option value="sms">SMS</option>
                <option value="email">Email</option>
              </select>
            </label>
          </div>
          <div
            className={`consent-banner ${client.consent[channel] ? "ready" : "blocked"}`}
          >
            <ShieldCheck size={17} />
            <span>
              <b>
                {client.consent[channel]
                  ? `${channel.toUpperCase()} consent recorded`
                  : `${channel.toUpperCase()} unavailable`}
              </b>
              <small>
                {client.consent[channel]
                  ? "Synthetic consent captured with communication preferences."
                  : "Choose an allowed channel before adding this message to the outbox."}
              </small>
            </span>
          </div>
          <div className="template-row" aria-label="Message templates">
            {messageTemplates.map((template) => (
              <button
                onClick={() => chooseTemplate(template.body)}
                key={template.label}
              >
                {template.label}
              </button>
            ))}
          </div>
          <label className="message-field">
            <span>Message</span>
            <textarea
              aria-label="Synthetic message"
              placeholder="Choose a template or write a minimum-necessary message."
              value={body}
              maxLength={320}
              onChange={(event) => setBody(event.target.value)}
            />
            <small>
              {body.length}/320 · Avoid clinical detail in notifications.
            </small>
          </label>
          {issues.length > 0 && body && (
            <p className="message-issue" role="status">
              {issues.join(" · ")}
            </p>
          )}
          <button
            className="primary"
            disabled={issues.length > 0}
            onClick={queue}
          >
            <Send size={15} /> Queue synthetic message
          </button>
          {queuedForClient.length > 0 && (
            <div className="outbox-list">
              <small>LOCAL OUTBOX · NOT SENT</small>
              {queuedForClient.map((message) => (
                <div key={message.id}>
                  <span>
                    <b>{message.id}</b>
                    <small>{message.channel.toUpperCase()} · Queued</small>
                  </span>
                  <p>{message.body}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Shell>
  );
}
const noteLabels: Record<keyof SoapNote, { label: string; prompt: string }> = {
  subjective: { label: "Subjective", prompt: "What the client reported" },
  objective: { label: "Objective", prompt: "What you observed and treated" },
  assessment: { label: "Assessment", prompt: "How the client responded" },
  plan: { label: "Plan", prompt: "Follow-up and home care" },
};
function Care({ privacy }: { privacy: boolean }) {
  const [note, setNote] = useSessionState<SoapNote>("care:note", {
    subjective:
      "Client reported bilateral shoulder tension after a busy work week.",
    objective:
      "Moderate pressure applied with slow compressions; tissue softened without guarding.",
    assessment:
      "Client reported greater ease and demonstrated improved shoulder movement.",
    plan: "Hydrate, use gentle shoulder movement, and reassess at the next visit.",
  });
  const [active, setActive] = useSessionState<keyof SoapNote>(
    "care:active-section",
    "subjective",
  );
  const [regions, setRegions] = useSessionState("care:regions", [
    "Left shoulder",
    "Right shoulder",
  ]);
  const [reviewing, setReviewing] = useSessionState("care:reviewing", false);
  const [attested, setAttested] = useSessionState("care:attested", false);
  const [snapshot, setSnapshot] = useSessionState<ReturnType<
    typeof sign<{ note: SoapNote; regions: string[] }>
  > | null>("care:signed-snapshot", null);
  const missing = noteReadiness(note, regions);
  const regionOptions = [
    "Neck",
    "Left shoulder",
    "Right shoulder",
    "Upper back",
    "Lower back",
    "Left hip",
    "Right hip",
  ];
  const toggleRegion = (region: string) =>
    setRegions((current) =>
      current.includes(region)
        ? current.filter((item) => item !== region)
        : [...current, region],
    );
  const finish = () => {
    if (!attested || missing.length) return;
    setSnapshot(sign({ note, regions }, new Date().toISOString()));
    setReviewing(false);
  };
  return (
    <Shell
      tag="CARE · SYNTHETIC ENCOUNTER"
      title="Chart what happened today"
      copy="Move from visit context to a reviewable, immutable note without losing the client’s care preferences."
    >
      <section className="encounter-bar">
        <div>
          <small>IN SERVICE · 9:00–10:00</small>
          <b>{privacy ? "Client hidden" : "Maya Rivers"}</b>
          <span>Restore Flow · Willow room</span>
        </div>
        <div>
          <small>CARE PREFERENCES</small>
          <b>Moderate pressure · Unscented</b>
          <span>Bolster under knees · Verbal check-in</span>
        </div>
        <span className="visit-status">
          {snapshot ? "Documented" : "In progress"}
        </span>
      </section>
      {snapshot ? (
        <section className="card signed-note">
          <div className="signed-heading">
            <FileCheck2 />
            <div>
              <small>SIGNED NOTE · VERSION {snapshot.version}</small>
              <h3>Encounter documentation locked</h3>
              <p>
                Signed{" "}
                {new Date(snapshot.time).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
                . Future changes require an addendum.
              </p>
            </div>
          </div>
          <div className="signed-grid">
            {(Object.keys(noteLabels) as (keyof SoapNote)[]).map((key) => (
              <div key={key}>
                <small>{noteLabels[key].label}</small>
                <p>{snapshot.value.note[key]}</p>
              </div>
            ))}
          </div>
          <div className="region-summary">
            <b>Treated regions</b>
            <span>{snapshot.value.regions.join(" · ")}</span>
          </div>
        </section>
      ) : reviewing ? (
        <section className="review-note">
          <div className="review-title">
            <div>
              <small>FINAL REVIEW</small>
              <h3>Review before signing</h3>
              <p>
                Signing creates an immutable snapshot of this note and
                body-region record.
              </p>
            </div>
            <button onClick={() => setReviewing(false)}>Back to edit</button>
          </div>
          <div className="review-grid">
            {(Object.keys(noteLabels) as (keyof SoapNote)[]).map((key) => (
              <article key={key}>
                <small>{noteLabels[key].label}</small>
                <p>{note[key] || "Missing"}</p>
              </article>
            ))}
          </div>
          <div className="region-summary">
            <b>Treated regions</b>
            <span>{regions.join(" · ") || "None selected"}</span>
          </div>
          {missing.length > 0 && (
            <p className="conflict">
              <b>Complete before signing</b>
              <span>{missing.join(", ")}</span>
            </p>
          )}
          <label className="attestation">
            <input
              type="checkbox"
              checked={attested}
              onChange={(event) => setAttested(event.target.checked)}
            />
            <span>
              <b>I reviewed this encounter note.</b>
              <small>
                I confirm it accurately reflects the synthetic care provided
                today.
              </small>
            </span>
          </label>
          <button
            className="primary"
            disabled={!attested || missing.length > 0}
            onClick={finish}
          >
            <LockKeyhole size={16} /> Sign and lock note
          </button>
        </section>
      ) : (
        <div className="care-layout">
          <section className="card note-editor">
            <div className="editor-head">
              <div>
                <small>SOAP NOTE · DRAFT SAVED</small>
                <h3>Encounter note</h3>
              </div>
              <span>
                {4 -
                  missing.filter((item) => item !== "Treated regions").length}
                /4 sections
              </span>
            </div>
            <div
              className="note-tabs"
              role="tablist"
              aria-label="SOAP note sections"
            >
              {(Object.keys(noteLabels) as (keyof SoapNote)[]).map((key) => (
                <button
                  role="tab"
                  aria-selected={active === key}
                  className={active === key ? "selected" : ""}
                  onClick={() => setActive(key)}
                  key={key}
                >
                  {noteLabels[key].label}
                  <small>{note[key].trim() ? "Complete" : "Missing"}</small>
                </button>
              ))}
            </div>
            <label className="note-field">
              <span>{noteLabels[active].prompt}</span>
              <textarea
                aria-label={`${noteLabels[active].label} note`}
                value={note[active]}
                onChange={(event) =>
                  setNote((current) => ({
                    ...current,
                    [active]: event.target.value,
                  }))
                }
              />
              <small>Draft changes are saved in this synthetic session.</small>
            </label>
            <button className="primary" onClick={() => setReviewing(true)}>
              Review note <ChevronRight size={16} />
            </button>
          </section>
          <section className="card body-record">
            <small>BODY REGIONS · SELECT ALL TREATED</small>
            <h3>Treatment record</h3>
            <p>
              Select regions to create both a visual record and an accessible
              text equivalent.
            </p>
            <div className="body-map" aria-label="Body region selection">
              {regionOptions.map((region) => (
                <button
                  aria-pressed={regions.includes(region)}
                  className={regions.includes(region) ? "selected" : ""}
                  onClick={() => toggleRegion(region)}
                  key={region}
                >
                  {region}
                </button>
              ))}
            </div>
            <div className="region-summary">
              <b>Text equivalent</b>
              <span>
                {regions.length
                  ? `Treated · ${regions.join(", ")}`
                  : "No treated regions selected"}
              </span>
            </div>
            <div className="row">
              <span className="dot" />
              <b>Response · greater ease</b>
            </div>
            <div className="row">
              <span className="dot" />
              <b>No-touch regions · none recorded</b>
            </div>
          </section>
        </div>
      )}
    </Shell>
  );
}
function Community() {
  const authorized = 14;
  const [entries, setEntries] = useSessionState("community:entries", [
    { id: "opening-balance", delta: 8 },
    { id: "visit-2026-07-15", delta: 1 },
    { id: "visit-2026-07-22", delta: 1 },
  ]);
  const [attested, setAttested] = useSessionState("community:attested", false);
  const [service, setService] = useSessionState(
    "community:service",
    "Massage therapy · 6 visits",
  );
  const [exported, setExported] = useSessionState("community:exported", false);
  const used = balance(entries);
  const remaining = authorized - used;
  const recordVisit = () =>
    setEntries((current) => [
      ...appendAuthorizedEntry(
        current,
        { id: `visit-2026-07-${23 + current.length}`, delta: 1 },
        authorized,
      ),
    ]);
  return (
    <Shell
      tag="COMMUNITY CARE · SYNTHETIC"
      title="Stay ahead of authorization"
      copy="A guarded utilization ledger and continuation packet keep authorization work visible before care is interrupted."
    >
      <div className="metrics authorization-metrics">
        <b>
          {authorized}
          <small>Authorized visits</small>
        </b>
        <b>
          {used}
          <small>Consumed visits</small>
        </b>
        <b>
          {remaining}
          <small>Remaining visits</small>
        </b>
        <b>
          Aug 30<small>Authorization ends</small>
        </b>
      </div>
      {remaining <= 4 && (
        <section className="authorization-alert">
          <Clock3 />
          <div>
            <b>Continuation window is open</b>
            <span>
              {remaining} visits remain. Prepare the request now to protect
              continuity of care.
            </span>
          </div>
          <span>Action recommended</span>
        </section>
      )}
      <div className="authorization-layout">
        <section className="card utilization">
          <div className="section-heading">
            <div>
              <small>APPEND-ONLY HISTORY</small>
              <h3>Utilization ledger</h3>
            </div>
            <span>{Math.round((used / authorized) * 100)}% used</span>
          </div>
          <div className="usage-track">
            <span style={{ width: `${(used / authorized) * 100}%` }} />
          </div>
          <div className="ledger-head">
            <span>Event</span>
            <span>Recorded</span>
            <span>Change</span>
          </div>
          {entries.map((entry, index) => (
            <div className="ledger ledger-row" key={entry.id}>
              <span>
                <b>
                  {index === 0 ? "Verified opening balance" : "Completed visit"}
                </b>
                <small>{entry.id}</small>
              </span>
              <span>
                {index === 0 ? "Jul 1" : `Jul ${Number(entry.id.slice(-2))}`}
              </span>
              <b>+{entry.delta}</b>
            </div>
          ))}
          <button disabled={!remaining} onClick={recordVisit}>
            <Plus size={15} /> Record completed synthetic visit
          </button>
          <p className="ledger-note">
            <ShieldCheck size={14} /> Corrections are appended as new events;
            historical entries are never overwritten.
          </p>
        </section>
        <section className="card request-builder">
          <div className="section-heading">
            <div>
              <small>REQUEST FOR SERVICES</small>
              <h3>Continuation packet</h3>
            </div>
            <span className={attested ? "ready" : "draft"}>
              {attested ? "Ready" : "Draft"}
            </span>
          </div>
          <div className="packet-checks">
            <div>
              <CheckCircle2 />
              <span>
                <b>Utilization verified</b>
                <small>{used} visits reconciled to the ledger</small>
              </span>
            </div>
            <div>
              <CheckCircle2 />
              <span>
                <b>Progress note signed</b>
                <small>Encounter note v1 · July 22</small>
              </span>
            </div>
            <div>
              <CheckCircle2 />
              <span>
                <b>Continuation timing met</b>
                <small>{remaining} authorized visits remain</small>
              </span>
            </div>
          </div>
          <label className="field">
            <span>Requested service</span>
            <select
              value={service}
              onChange={(event) => setService(event.target.value)}
            >
              <option>Massage therapy · 6 visits</option>
              <option>Massage therapy · 8 visits</option>
              <option>Massage therapy · 12 visits</option>
            </select>
          </label>
          <label className="attestation">
            <input
              type="checkbox"
              checked={attested}
              onChange={(event) => {
                setAttested(event.target.checked);
                setExported(false);
              }}
            />
            <span>
              <b>Provider attestation complete</b>
              <small>
                I reviewed utilization and the signed progress documentation.
              </small>
            </span>
          </label>
          <button
            className="primary"
            disabled={!attested}
            onClick={() => setExported(true)}
          >
            Create continuation packet
          </button>
          {exported && (
            <div className="export-result" role="status">
              <FileCheck2 />
              <span>
                <b>Packet RFS-2026-1042 created</b>
                <small>{service} · Synthetic PDF bundle</small>
                <em>Created, not submitted</em>
              </span>
            </div>
          )}
        </section>
      </div>
    </Shell>
  );
}
function Money() {
  const initial: MoneyEntry[] = [
    { id: "pay-1048", kind: "charge", cents: 12500 },
    { id: "tip-1048", kind: "tip", cents: 2000 },
    { id: "fee-1048", kind: "fee", cents: -473 },
  ];
  const [entries, setEntries] = useSessionState("money:entries", initial);
  const [refunding, setRefunding] = useSessionState("money:refunding", false);
  const [amount, setAmount] = useSessionState("money:refund-amount", "125.00");
  const [reason, setReason] = useSessionState(
    "money:refund-reason",
    "Client request",
  );
  const [receipt, setReceipt] = useSessionState("money:receipt", false);
  const net = moneyTotal(entries);
  const refunded = -entries
    .filter((entry) => entry.kind === "refund")
    .reduce((sum, entry) => sum + entry.cents, 0);
  const submitRefund = () => {
    const cents = Math.round(Number(amount) * 100);
    setEntries((current) => [
      ...recordRefund(current, "pay-1048", `refund-${current.length}`, cents),
    ]);
    setRefunding(false);
    setReceipt(true);
  };
  const rows = [
    {
      id: "pay-1048",
      label: "Restore Flow",
      detail: "Card ending 4242 · 10:02 AM",
      amount: 12500,
    },
    {
      id: "tip-1048",
      label: "Gratuity",
      detail: "Captured with payment",
      amount: 2000,
    },
    {
      id: "fee-1048",
      label: "Processing fee",
      detail: "Sandbox processor",
      amount: -473,
    },
    ...entries
      .filter((entry) => entry.kind === "refund")
      .map((entry) => ({
        id: entry.id,
        label: "Refund adjustment",
        detail: `${reason} · Sandbox`,
        amount: entry.cents,
      })),
  ];
  return (
    <Shell
      tag="MONEY · SANDBOX"
      title="Every dollar keeps its history"
      copy="Payments, fees, gratuity, and refunds reconcile through immutable events without exposing raw card details."
    >
      <div className="metrics money-metrics">
        <b>
          $145.00<small>Client paid</small>
        </b>
        <b>
          −$4.73<small>Processing fees</small>
        </b>
        <b>
          ${(net / 100).toFixed(2)}
          <small>Net proceeds</small>
        </b>
        <b>
          $0.00<small>Unexplained variance</small>
        </b>
      </div>
      <div className="money-layout">
        <section className="card payment-ledger">
          <div className="section-heading">
            <div>
              <small>PAYMENT PAY-1048</small>
              <h3>Transaction ledger</h3>
            </div>
            <span className="ready">Reconciled</span>
          </div>
          <div className="money-head">
            <span>Event</span>
            <span>Amount</span>
          </div>
          {rows.map((row) => (
            <div className="money-row" key={row.id}>
              <span>
                <b>{row.label}</b>
                <small>{row.detail}</small>
              </span>
              <b className={row.amount < 0 ? "negative" : ""}>
                {row.amount < 0 ? "−" : ""}$
                {(Math.abs(row.amount) / 100).toFixed(2)}
              </b>
            </div>
          ))}
          <div className="money-total">
            <span>Net proceeds</span>
            <b>${(net / 100).toFixed(2)}</b>
          </div>
          <button
            disabled={refunded >= 12500}
            onClick={() => {
              setRefunding(true);
              setReceipt(false);
            }}
          >
            Issue sandbox refund
          </button>
          <p className="ledger-note">
            <ShieldCheck size={14} /> Refunds append adjustments; the original
            payment remains unchanged.
          </p>
        </section>
        <section className="money-side">
          {refunding ? (
            <section className="card refund-card">
              <div className="section-heading">
                <div>
                  <small>REFUND PAYMENT</small>
                  <h3>Issue adjustment</h3>
                </div>
                <button onClick={() => setRefunding(false)}>Cancel</button>
              </div>
              <div className="refund-source">
                <span>Available to refund</span>
                <b>${((12500 - refunded) / 100).toFixed(2)}</b>
              </div>
              <label className="field">
                <span>Refund amount</span>
                <div className="currency-input">
                  <b>$</b>
                  <input
                    aria-label="Refund amount"
                    inputMode="decimal"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                </div>
              </label>
              <label className="field">
                <span>Reason</span>
                <select
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                >
                  <option>Client request</option>
                  <option>Service adjustment</option>
                  <option>Duplicate payment</option>
                </select>
              </label>
              <p className="notice">
                This creates a sandbox adjustment. No real funds will move.
              </p>
              <button
                className="primary"
                disabled={
                  !Number(amount) ||
                  Number(amount) <= 0 ||
                  Number(amount) * 100 > 12500 - refunded
                }
                onClick={submitRefund}
              >
                Confirm sandbox refund
              </button>
            </section>
          ) : (
            <section className="card reconciliation">
              <div className="section-heading">
                <div>
                  <small>DAILY CLOSE</small>
                  <h3>Reconciliation</h3>
                </div>
                <CheckCircle2 />
              </div>
              <div className="recon-row">
                <span>Empress ledger</span>
                <b>${(net / 100).toFixed(2)}</b>
              </div>
              <div className="recon-row">
                <span>Processor settlement</span>
                <b>${(net / 100).toFixed(2)}</b>
              </div>
              <div className="recon-row variance">
                <span>Variance</span>
                <b>$0.00</b>
              </div>
              <p>
                Webhook events are replay-protected and matched to a single
                synthetic payment.
              </p>
            </section>
          )}
          {receipt && (
            <section className="export-result refund-receipt" role="status">
              <FileCheck2 />
              <span>
                <b>Refund adjustment recorded</b>
                <small>Receipt RF-1048 · {reason}</small>
                <em>Sandbox transaction</em>
              </span>
            </section>
          )}
        </section>
      </div>
    </Shell>
  );
}
const flowSteps = [
  {
    id: "goal",
    eyebrow: "ARRIVAL",
    title: "Confirm today’s goal",
    copy: "Use the client’s own words to establish the intention for this session.",
    options: [
      "Settle and relax",
      "Improve comfortable movement",
      "Reduce perceived tension",
    ],
  },
  {
    id: "consent",
    eyebrow: "CONSENT",
    title: "Confirm pressure and stop signal",
    copy: "Consent remains active and can change throughout the visit.",
    options: [
      "Light pressure · verbal stop",
      "Moderate pressure · verbal stop",
      "Variable pressure · hand signal",
    ],
  },
  {
    id: "focus",
    eyebrow: "FOCUS",
    title: "Review focus regions",
    copy: "Confirm focus and no-touch regions before beginning care.",
    options: [
      "Shoulders and upper back",
      "Neck and shoulders",
      "Full back · avoid lower spine",
    ],
  },
  {
    id: "response",
    eyebrow: "CLOSE",
    title: "Document the response",
    copy: "Record the client’s reported response without making a diagnosis.",
    options: [
      "Greater ease reported",
      "Comfortable movement improved",
      "No material change reported",
    ],
  },
];
function Flows() {
  const [active, setActive] = useSessionState("flows:active-step", 0);
  const [answers, setAnswers] = useSessionState<FlowAnswer[]>(
    "flows:answers",
    [],
  );
  const [reviewing, setReviewing] = useSessionState("flows:reviewing", false);
  const [completed, setCompleted] = useSessionState("flows:completed", false);
  const step = flowSteps[active];
  const progress = flowProgress(
    flowSteps.map((item) => item.id),
    answers,
  );
  const current =
    answers.find((answer) => answer.stepId === step.id)?.value ?? "";
  const choose = (value: string) =>
    setAnswers((existing) => [
      ...upsertFlowAnswer(existing, { stepId: step.id, value }),
    ]);
  const next = () => {
    if (active < flowSteps.length - 1) setActive((index) => index + 1);
    else setReviewing(true);
  };
  return (
    <Shell
      tag="EMPRESS FLOWS · SYNTHETIC"
      title="Guidance that supports judgment"
      copy="Versioned visit guidance keeps consent, preferences, and documentation prompts visible without making clinical decisions."
    >
      {completed ? (
        <section className="card flow-complete">
          <CheckCircle2 />
          <small>RESTORE FLOW · DRAFT COMPLETE</small>
          <h3>Encounter draft prepared</h3>
          <p>
            The guided responses are ready to carry into Care for therapist
            review. Nothing was signed automatically.
          </p>
          <div className="flow-summary">
            {answers.map((answer) => (
              <div key={answer.stepId}>
                <b>
                  {flowSteps.find((item) => item.id === answer.stepId)?.title}
                </b>
                <span>{answer.value}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              setCompleted(false);
              setReviewing(false);
              setActive(0);
            }}
          >
            Start another synthetic flow
          </button>
        </section>
      ) : reviewing ? (
        <section className="card flow-review">
          <div className="review-title">
            <div>
              <small>FINAL REVIEW</small>
              <h3>Review the guided draft</h3>
              <p>
                Confirm these responses before creating an editable encounter
                draft.
              </p>
            </div>
            <button onClick={() => setReviewing(false)}>Back to flow</button>
          </div>
          <div className="flow-summary">
            {flowSteps.map((item) => (
              <div key={item.id}>
                <b>{item.title}</b>
                <span>
                  {answers.find((answer) => answer.stepId === item.id)?.value ??
                    "Missing response"}
                </span>
                <button
                  onClick={() => {
                    setActive(flowSteps.indexOf(item));
                    setReviewing(false);
                  }}
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
          <p className="notice">
            Documentation aid only. This draft does not determine
            appropriateness or sign the clinical record.
          </p>
          <button
            className="primary"
            disabled={!progress.ready}
            onClick={() => setCompleted(true)}
          >
            Create encounter draft
          </button>
        </section>
      ) : (
        <div className="flow-layout">
          <section className="card flow-runner">
            <div className="flow-progress">
              <span>RESTORE FLOW · VERSION 2.1</span>
              <b>
                {progress.complete} of {progress.total} complete
              </b>
            </div>
            <div className="usage-track">
              <span
                style={{
                  width: `${(progress.complete / progress.total) * 100}%`,
                }}
              />
            </div>
            <small>
              {step.eyebrow} · STEP {active + 1} OF {flowSteps.length}
            </small>
            <h3>{step.title}</h3>
            <p>{step.copy}</p>
            <div
              className="flow-options"
              role="radiogroup"
              aria-label={step.title}
            >
              {step.options.map((option) => (
                <button
                  role="radio"
                  aria-checked={current === option}
                  className={current === option ? "selected" : ""}
                  onClick={() => choose(option)}
                  key={option}
                >
                  <span>{current === option ? "✓" : ""}</span>
                  {option}
                </button>
              ))}
            </div>
            <div className="flow-actions">
              <button
                disabled={active === 0}
                onClick={() => setActive((index) => index - 1)}
              >
                Back
              </button>
              <button className="primary" disabled={!current} onClick={next}>
                {active === flowSteps.length - 1
                  ? "Review draft"
                  : "Save and continue"}{" "}
                <ChevronRight size={16} />
              </button>
            </div>
          </section>
          <aside className="card flow-context">
            <small>SESSION CONTEXT</small>
            <h3>Restore Flow</h3>
            <dl>
              <dt>Client goal</dt>
              <dd>
                {answers.find((answer) => answer.stepId === "goal")?.value ??
                  "Not confirmed"}
              </dd>
              <dt>Consent signal</dt>
              <dd>
                {answers.find((answer) => answer.stepId === "consent")?.value ??
                  "Not confirmed"}
              </dd>
              <dt>Focus</dt>
              <dd>
                {answers.find((answer) => answer.stepId === "focus")?.value ??
                  "Not confirmed"}
              </dd>
            </dl>
            <div className="flow-safety">
              <ShieldCheck />
              <span>
                <b>Therapist judgment stays primary</b>This Flow never
                diagnoses, prescribes, or overrides consent.
              </span>
            </div>
          </aside>
        </div>
      )}
    </Shell>
  );
}
const defaultServices: ServiceOffering[] = [
  {
    id: "restore",
    name: "Restore Flow",
    durationMinutes: 60,
    bufferMinutes: 15,
    priceCents: 12500,
    channel: "studio",
    active: true,
  },
  {
    id: "reset",
    name: "Reset Session",
    durationMinutes: 45,
    bufferMinutes: 15,
    priceCents: 8500,
    channel: "both",
    active: true,
  },
  {
    id: "community",
    name: "Community Care Massage",
    durationMinutes: 60,
    bufferMinutes: 15,
    priceCents: 10500,
    channel: "studio",
    active: true,
  },
];
function Services() {
  const [services, setServices] = useSessionState<ServiceOffering[]>(
    "services:catalog",
    defaultServices,
  );
  const [selected, setSelected] = useSessionState("services:selected", 0);
  const [draft, setDraft] = useState<ServiceOffering>(() => ({
    ...services[selected],
  }));
  const [saved, setSaved] = useState(false);
  const issues = serviceReadiness(draft);
  const choose = (index: number) => {
    setSelected(index);
    setDraft({ ...services[index] });
    setSaved(false);
  };
  const save = () => {
    setServices((current) => updateService(current, draft));
    setSaved(true);
  };
  const price = (draft.priceCents / 100).toFixed(2);
  return (
    <Shell
      tag="SERVICES · PRACTICE CATALOG"
      title="Shape the care you offer"
      copy="Configure duration, reset time, pricing, and delivery boundaries that downstream scheduling can enforce consistently."
    >
      <div className="service-layout">
        <aside className="card service-list">
          <div className="section-heading">
            <div>
              <small>CATALOG</small>
              <h3>{services.length} services</h3>
            </div>
            <span>
              {services.filter((service) => service.active).length} active
            </span>
          </div>
          {services.map((service, index) => (
            <button
              className={selected === index ? "selected" : ""}
              aria-pressed={selected === index}
              onClick={() => choose(index)}
              key={service.id}
            >
              <span>
                <b>{service.name}</b>
                <small>
                  {service.durationMinutes} min · $
                  {(service.priceCents / 100).toFixed(0)}
                </small>
              </span>
              <em className={service.active ? "active" : "inactive"}>
                {service.active ? "Active" : "Hidden"}
              </em>
            </button>
          ))}
        </aside>
        <section className="card service-editor">
          <div className="section-heading">
            <div>
              <small>EDIT SERVICE</small>
              <h3>{draft.name || "Untitled service"}</h3>
            </div>
            <label className="service-switch">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(event) => {
                  setDraft({ ...draft, active: event.target.checked });
                  setSaved(false);
                }}
              />
              <span>Bookable</span>
            </label>
          </div>
          <div className="service-fields">
            <label className="field">
              <span>Service name</span>
              <input
                value={draft.name}
                onChange={(event) => {
                  setDraft({ ...draft, name: event.target.value });
                  setSaved(false);
                }}
              />
            </label>
            <label className="field">
              <span>Delivery</span>
              <select
                value={draft.channel}
                onChange={(event) => {
                  setDraft({
                    ...draft,
                    channel: event.target.value as ServiceOffering["channel"],
                  });
                  setSaved(false);
                }}
              >
                <option value="studio">Studio</option>
                <option value="mobile">Mobile</option>
                <option value="both">Studio + mobile</option>
              </select>
            </label>
            <label className="field">
              <span>Care duration · minutes</span>
              <input
                type="number"
                min="15"
                max="240"
                value={draft.durationMinutes}
                onChange={(event) => {
                  setDraft({
                    ...draft,
                    durationMinutes: Number(event.target.value),
                  });
                  setSaved(false);
                }}
              />
            </label>
            <label className="field">
              <span>Reset buffer · minutes</span>
              <input
                type="number"
                min="0"
                max="90"
                value={draft.bufferMinutes}
                onChange={(event) => {
                  setDraft({
                    ...draft,
                    bufferMinutes: Number(event.target.value),
                  });
                  setSaved(false);
                }}
              />
            </label>
            <label className="field">
              <span>Price · USD</span>
              <div className="currency-input">
                <b>$</b>
                <input
                  aria-label="Service price"
                  inputMode="decimal"
                  value={price}
                  onChange={(event) => {
                    setDraft({
                      ...draft,
                      priceCents:
                        Math.round(Number(event.target.value) * 100) || 0,
                    });
                    setSaved(false);
                  }}
                />
              </div>
            </label>
          </div>
          <div className="service-preview">
            <div>
              <small>TOTAL RESOURCE WINDOW</small>
              <b>{serviceWindowMinutes(draft)} minutes</b>
              <span>
                {draft.durationMinutes} care + {draft.bufferMinutes} reset
              </span>
            </div>
            <div>
              <small>THEORETICAL DAY</small>
              <b>{bookableStarts(540, 1020, draft)} starts</b>
              <span>9:00 AM–5:00 PM before other constraints</span>
            </div>
          </div>
          {issues.length > 0 && (
            <p className="message-issue" role="status">
              {issues.join(" · ")}
            </p>
          )}
          {saved && (
            <p className="service-saved" role="status">
              <CheckCircle2 size={16} /> Catalog update saved to this synthetic
              session.
            </p>
          )}
          <button
            className="primary"
            disabled={issues.length > 0 || saved}
            onClick={save}
          >
            {saved ? "Saved" : "Save service configuration"}
          </button>
        </section>
      </div>
    </Shell>
  );
}
const products = [
  {
    id: "cream",
    name: "Unscented massage cream",
    copy: "Professional glide · fragrance-free",
    price: 2400,
    stock: 4,
    tone: "sage",
  },
  {
    id: "bolster",
    name: "Knee bolster cover",
    copy: "Washable cotton · natural",
    price: 1800,
    stock: 7,
    tone: "sand",
  },
  {
    id: "oil",
    name: "Jojoba care oil",
    copy: "Synthetic product · 4 oz",
    price: 1600,
    stock: 3,
    tone: "gold",
  },
];
function Store() {
  const [cart, setCart] = useSessionState<CartLine[]>("store:cart", []);
  const [ordered, setOrdered] = useSessionState("store:ordered", false);
  const total = cartTotal(cart);
  const count = cart.reduce((sum, line) => sum + line.quantity, 0);
  const update = (productId: string, quantity: number) => {
    const product = products.find((item) => item.id === productId)!;
    setCart((lines) => [
      ...setCartQuantity(lines, productId, quantity, product.stock),
    ]);
    setOrdered(false);
  };
  return (
    <Shell
      tag="STORE · SANDBOX"
      title="Commerce without clinical targeting"
      copy="A bounded retail cart keeps catalog and inventory data separate from protected care records."
    >
      <div className="store-layout">
        <section>
          <div className="store-head">
            <div>
              <small>CLINIC RETAIL</small>
              <h3>Care essentials</h3>
            </div>
            <span>{products.length} synthetic products</span>
          </div>
          <div className="product-grid">
            {products.map((product) => {
              const quantity =
                cart.find((line) => line.productId === product.id)?.quantity ??
                0;
              return (
                <article className="card store-product" key={product.id}>
                  <div className={`product-art ${product.tone}`}>
                    <Leaf />
                  </div>
                  <small>{product.stock - quantity} AVAILABLE</small>
                  <h3>{product.name}</h3>
                  <p>{product.copy}</p>
                  <div className="product-buy">
                    <b>${(product.price / 100).toFixed(2)}</b>
                    <button
                      disabled={quantity >= product.stock}
                      onClick={() => {
                        setCart((lines) => [
                          ...addCartItem(
                            lines,
                            product.id,
                            product.price,
                            product.stock,
                          ),
                        ]);
                        setOrdered(false);
                      }}
                    >
                      <Plus size={15} /> Add
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
        <aside className="card cart-panel">
          <div className="section-heading">
            <div>
              <small>SANDBOX ORDER</small>
              <h3>
                Cart · {count} {count === 1 ? "item" : "items"}
              </h3>
            </div>
            <span>{count ? "Draft" : "Empty"}</span>
          </div>
          {cart.length ? (
            cart.map((line) => {
              const product = products.find(
                (item) => item.id === line.productId,
              )!;
              return (
                <div className="cart-line" key={line.productId}>
                  <span>
                    <b>{product.name}</b>
                    <small>${(line.unitCents / 100).toFixed(2)} each</small>
                  </span>
                  <div>
                    <button
                      aria-label={`Decrease ${product.name}`}
                      onClick={() => update(line.productId, line.quantity - 1)}
                    >
                      −
                    </button>
                    <b>{line.quantity}</b>
                    <button
                      aria-label={`Increase ${product.name}`}
                      disabled={line.quantity >= product.stock}
                      onClick={() => update(line.productId, line.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <b>${((line.quantity * line.unitCents) / 100).toFixed(2)}</b>
                </div>
              );
            })
          ) : (
            <div className="cart-empty">
              <Leaf />
              <b>Your cart is empty</b>
              <span>Add retail products to prepare a pickup order.</span>
            </div>
          )}
          <div className="cart-total">
            <span>Merchandise total</span>
            <b>${(total / 100).toFixed(2)}</b>
          </div>
          <p className="notice">
            Sandbox pickup at Empress Wellness · no shipping or real payment.
          </p>
          <button
            className="primary"
            disabled={!cart.length}
            onClick={() => setOrdered(true)}
          >
            Confirm sandbox order
          </button>
          {ordered && (
            <div className="export-result" role="status">
              <CheckCircle2 />
              <span>
                <b>Order SO-2048 confirmed</b>
                <small>{count} items · Clinic pickup</small>
                <em>No real payment collected</em>
              </span>
            </div>
          )}
        </aside>
      </div>
    </Shell>
  );
}
const weeklyVisitSignals: VisitSignal[] = [
  ...Array.from({ length: 11 }, (_, index) => ({
    id: `restore-${index}`,
    clientId: `EMP-${1024 + (index % 7)}`,
    service: "Restore Flow",
    status: "completed" as const,
    revenueCents: 12500,
  })),
  ...Array.from({ length: 4 }, (_, index) => ({
    id: `community-${index}`,
    clientId: `CC-${index % 3}`,
    service: "Community Care",
    status: "completed" as const,
    revenueCents: 10500,
  })),
  ...Array.from({ length: 2 }, (_, index) => ({
    id: `reset-${index}`,
    clientId: `EMP-${1035 + index}`,
    service: "Reset Session",
    status: "completed" as const,
    revenueCents: 8500,
  })),
  {
    id: "cancelled-1",
    clientId: "EMP-1040",
    service: "Restore Flow",
    status: "cancelled" as const,
    revenueCents: 12500,
  },
  {
    id: "scheduled-1",
    clientId: "EMP-1041",
    service: "Restore Flow",
    status: "scheduled" as const,
    revenueCents: 12500,
  },
];
const monthlyVisitSignals: VisitSignal[] = [
  ...weeklyVisitSignals,
  ...Array.from({ length: 39 }, (_, index) => ({
    id: `month-${index}`,
    clientId: `EMP-${1024 + (index % 22)}`,
    service:
      index % 5 === 0
        ? "Community Care"
        : index % 7 === 0
          ? "Reset Session"
          : "Restore Flow",
    status: "completed" as const,
    revenueCents: index % 5 === 0 ? 10500 : index % 7 === 0 ? 8500 : 12500,
  })),
];
function Insights() {
  const [period, setPeriod] = useSessionState<"7" | "30">(
    "insights:period",
    "7",
  );
  const summary = summarizePractice(
    period === "7" ? weeklyVisitSignals : monthlyVisitSignals,
    period === "7" ? 22 : 78,
  );
  const revenueBaseline = period === "7" ? 188500 : 647000;
  const revenueChange = percentageChange(summary.revenueCents, revenueBaseline);
  const daily =
    period === "7" ? [2, 4, 3, 4, 3, 1, 0] : [12, 15, 14, 17, 13, 11, 10];
  const maxDay = Math.max(...daily);
  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  return (
    <Shell
      tag="INSIGHTS · SYNTHETIC OPERATIONS"
      title="See the shape of the practice"
      copy="Review minimum-necessary operating signals without exposing client names, clinical narrative, or individual payment details."
    >
      <div className="insight-toolbar">
        <div>
          <small>REPORTING WINDOW</small>
          <b>{period === "7" ? "July 16–22" : "June 23–July 22"}</b>
        </div>
        <div className="period-toggle" role="group" aria-label="Insight period">
          <button
            className={period === "7" ? "selected" : ""}
            onClick={() => setPeriod("7")}
          >
            7 days
          </button>
          <button
            className={period === "30" ? "selected" : ""}
            onClick={() => setPeriod("30")}
          >
            30 days
          </button>
        </div>
      </div>
      <section className="insight-metrics" aria-label="Practice summary">
        <article className="card">
          <small>COLLECTED REVENUE</small>
          <b>{money.format(summary.revenueCents / 100)}</b>
          <span
            className={
              revenueChange !== null && revenueChange >= 0
                ? "positive"
                : "neutral"
            }
          >
            {revenueChange === null
              ? "New baseline"
              : `${revenueChange >= 0 ? "+" : ""}${revenueChange}%`}{" "}
            vs prior period
          </span>
        </article>
        <article className="card">
          <small>COMPLETED VISITS</small>
          <b>{summary.completed}</b>
          <span>
            {summary.scheduled} upcoming · {summary.cancelled} cancelled
          </span>
        </article>
        <article className="card">
          <small>UTILIZATION</small>
          <b>{summary.utilizationPercent}%</b>
          <span>Completed visits / available slots</span>
        </article>
        <article className="card">
          <small>ACTIVE CLIENTS</small>
          <b>{summary.uniqueClients}</b>
          <span>{summary.returningClients} returning this period</span>
        </article>
      </section>
      <div className="insight-grid">
        <section className="card visit-chart">
          <div className="section-heading">
            <div>
              <small>VISIT RHYTHM</small>
              <h3>Completed care</h3>
            </div>
            <span>{summary.completed} visits</span>
          </div>
          <div
            className="bar-chart"
            role="img"
            aria-label={`Daily completed visits: ${daily.join(", ")}`}
          >
            {daily.map((count, index) => (
              <div key={index}>
                <span>{count}</span>
                <i
                  style={{ height: `${Math.max(5, (count / maxDay) * 100)}%` }}
                />
                <small>{["W", "T", "F", "S", "S", "M", "T"][index]}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="card service-mix">
          <div className="section-heading">
            <div>
              <small>SERVICE MIX</small>
              <h3>Care delivered</h3>
            </div>
            <BarChart3 size={21} />
          </div>
          {summary.serviceMix.map((service) => (
            <div className="mix-row" key={service.service}>
              <span>
                <b>{service.service}</b>
                <small>{service.visits} visits</small>
              </span>
              <div
                className="mix-track"
                aria-label={`${service.service}: ${service.percent}%`}
              >
                <i style={{ width: `${service.percent}%` }} />
              </div>
              <b>{service.percent}%</b>
            </div>
          ))}
          <p className="insight-note">
            <ShieldCheck size={14} /> Aggregated only; no individual client or
            clinical detail.
          </p>
        </section>
      </div>
    </Shell>
  );
}
const rolePermissions: {
  role: string;
  scope: string;
  permissions: Record<string, boolean>;
}[] = [
  {
    role: "Therapist",
    scope: "Assigned caseload · Willow clinic",
    permissions: {
      Schedule: true,
      Demographics: true,
      "Clinical notes": true,
      Payments: false,
      Administration: false,
    },
  },
  {
    role: "Front desk",
    scope: "Willow clinic · Operations",
    permissions: {
      Schedule: true,
      Demographics: true,
      "Clinical notes": false,
      Payments: true,
      Administration: false,
    },
  },
  {
    role: "Administrator",
    scope: "Synthetic practice · All locations",
    permissions: {
      Schedule: true,
      Demographics: true,
      "Clinical notes": false,
      Payments: true,
      Administration: true,
    },
  },
  {
    role: "Partner venue",
    scope: "Readiness projection only",
    permissions: {
      Schedule: true,
      Demographics: false,
      "Clinical notes": false,
      Payments: false,
      Administration: false,
    },
  },
];
const auditEvents: AuditEvent[] = [
  {
    id: "EVT-2041",
    category: "access",
    action: "Viewed assigned schedule",
    actor: "Elena Ruiz",
    resource: "schedule/day/2026-07-22",
    outcome: "allowed",
    time: "12:41 PM",
    correlationId: "COR-71A2",
  },
  {
    id: "EVT-2040",
    category: "change",
    action: "Acknowledged intake update",
    actor: "Elena Ruiz",
    resource: "client/EMP-1025/intake",
    outcome: "allowed",
    time: "12:36 PM",
    correlationId: "COR-719F",
  },
  {
    id: "EVT-2039",
    category: "export",
    action: "Created continuation packet",
    actor: "Elena Ruiz",
    resource: "authorization/RFS-2026-1042",
    outcome: "allowed",
    time: "12:31 PM",
    correlationId: "COR-7188",
  },
  {
    id: "EVT-2038",
    category: "access",
    action: "Clinical narrative request",
    actor: "Partner venue role",
    resource: "encounter/synthetic/note",
    outcome: "blocked",
    time: "12:18 PM",
    correlationId: "COR-716D",
  },
  {
    id: "EVT-2037",
    category: "change",
    action: "Updated role preview",
    actor: "Practice administrator",
    resource: "role/front-desk",
    outcome: "allowed",
    time: "11:54 AM",
    correlationId: "COR-713C",
  },
];
function Practice() {
  const [selected, setSelected] = useSessionState("practice:selected-role", 0);
  const [location, setLocation] = useSessionState(
    "practice:location",
    "Willow clinic",
  );
  const [filter, setFilter] = useSessionState<"all" | AuditEvent["category"]>(
    "practice:audit-filter",
    "all",
  );
  const [selectedEvent, setSelectedEvent] = useSessionState(
    "practice:selected-event",
    auditEvents[0].id,
  );
  const role = rolePermissions[selected];
  const events = filterAuditEvents(auditEvents, filter);
  const event =
    auditEvents.find((item) => item.id === selectedEvent) ?? events[0];
  const evidence = event ? auditProjection(event) : null;
  return (
    <Shell
      tag="PRACTICE · PERMISSIONS"
      title="Access follows purpose"
      copy="Preview effective access and inspect the redacted operational evidence trail without exposing client narrative."
    >
      <div className="practice-layout">
        <section className="card role-list">
          <small>ROLE PREVIEW</small>
          <h3>Choose a perspective</h3>
          {rolePermissions.map((item, index) => (
            <button
              className={selected === index ? "selected" : ""}
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
              key={item.role}
            >
              <span className="role-avatar">
                {item.role
                  .split(" ")
                  .map((word) => word[0])
                  .join("")}
              </span>
              <span>
                <b>{item.role}</b>
                <small>{item.scope}</small>
              </span>
              <ChevronRight />
            </button>
          ))}
        </section>
        <section className="card permission-panel">
          <div className="section-heading">
            <div>
              <small>EFFECTIVE ACCESS</small>
              <h3>{role.role}</h3>
            </div>
            <span>Preview only</span>
          </div>
          <label className="field">
            <span>Location context</span>
            <select
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            >
              <option>Willow clinic</option>
              <option>Oak partner venue</option>
            </select>
          </label>
          <div className="scope-banner">
            <ShieldCheck />
            <span>
              <b>{role.scope}</b>Current context · {location}
            </span>
          </div>
          <div className="permission-head">
            <span>Resource</span>
            <span>Effective access</span>
          </div>
          {Object.entries(role.permissions).map(([permission, allowed]) => (
            <div className="permission-row" key={permission}>
              <b>{permission}</b>
              <span className={allowed ? "allowed" : "restricted"}>
                {allowed ? "Allowed" : "Restricted"}
              </span>
            </div>
          ))}
          <p className="ledger-note">
            <LockKeyhole size={14} /> High-risk access remains purpose-bound and
            is written to the synthetic audit trail.
          </p>
        </section>
      </div>
      <section className="card audit-panel">
        <div className="audit-heading">
          <div>
            <small>REDACTED ACTIVITY</small>
            <h3>Practice audit trail</h3>
            <p>
              Operational evidence only. No client names or clinical narrative
              appear in these events.
            </p>
          </div>
          <div className="audit-filters" aria-label="Filter audit events">
            {(["all", "access", "change", "export"] as const).map((value) => (
              <button
                className={filter === value ? "selected" : ""}
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                key={value}
              >
                {value[0].toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="audit-layout">
          <div className="audit-events">
            {events.map((item) => (
              <button
                className={event?.id === item.id ? "selected" : ""}
                aria-pressed={event?.id === item.id}
                onClick={() => setSelectedEvent(item.id)}
                key={item.id}
              >
                <span className={`audit-icon ${item.outcome}`}>
                  {item.outcome === "allowed" ? "✓" : "!"}
                </span>
                <span>
                  <b>{item.action}</b>
                  <small>
                    {item.actor} · {item.time}
                  </small>
                </span>
                <em>{item.category}</em>
              </button>
            ))}
          </div>
          {evidence && (
            <aside className="audit-detail">
              <div className="section-heading">
                <div>
                  <small>EVENT EVIDENCE</small>
                  <h3>{evidence.eventId}</h3>
                </div>
                <span
                  className={evidence.outcome === "allowed" ? "ready" : "draft"}
                >
                  {evidence.outcome}
                </span>
              </div>
              <dl>
                <dt>Action</dt>
                <dd>{evidence.action}</dd>
                <dt>Actor</dt>
                <dd>{evidence.actor}</dd>
                <dt>Resource reference</dt>
                <dd>{evidence.resource}</dd>
                <dt>Timestamp</dt>
                <dd>{evidence.timestamp}</dd>
                <dt>Correlation ID</dt>
                <dd>{evidence.correlationId}</dd>
              </dl>
              <p>
                <ShieldCheck size={14} /> Minimum-necessary projection
              </p>
            </aside>
          )}
        </div>
      </section>
    </Shell>
  );
}
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
