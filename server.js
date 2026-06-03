const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const rooms = {};

function generateCode() { return Math.random().toString(36).substring(2, 8).toUpperCase(); }

const QUESTIONS = {
  general: [
    { q: "What's the capital of Australia? (No, it's not Sydney, genius.)", options: ["Sydney", "Melbourne", "Canberra", "Brisbane"], answer: 2 },
    { q: "How many sides does a triangle have? (Please get this right.)", options: ["2", "3", "4", "5"], answer: 1 },
    { q: "Water boils at what temperature?", options: ["90°C", "95°C", "100°C", "110°C"], answer: 2 },
    { q: "What planet is closest to the Sun?", options: ["Venus", "Mercury", "Earth", "Mars"], answer: 1 },
    { q: "How many bones are in the adult human body?", options: ["196", "206", "216", "226"], answer: 1 },
    { q: "What's the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], answer: 3 },
    { q: "What year did World War II end?", options: ["1943", "1944", "1945", "1946"], answer: 2 },
    { q: "What's the square root of 144?", options: ["11", "12", "13", "14"], answer: 1 },
  ],
  science: [
    { q: "What's the chemical symbol for gold?", options: ["Go", "Gd", "Au", "Ag"], answer: 2 },
    { q: "DNA stands for...?", options: ["Daily Nonsense", "Deoxyribonucleic Acid", "Dynamic Neural Array", "Distributed Nucleic Algorithm"], answer: 1 },
    { q: "How many chromosomes do humans have?", options: ["44", "46", "48", "50"], answer: 1 },
    { q: "What's the speed of light (approx)?", options: ["200,000 km/s", "250,000 km/s", "300,000 km/s", "350,000 km/s"], answer: 2 },
    { q: "What's the powerhouse of the cell?", options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi Body"], answer: 2 },
    { q: "What organ produces insulin?", options: ["Liver", "Kidney", "Pancreas", "Spleen"], answer: 2 },
    { q: "Which gas makes up ~78% of Earth's atmosphere?", options: ["Oxygen", "CO2", "Nitrogen", "Argon"], answer: 2 },
    { q: "How old is the Earth (approx)?", options: ["2.5 billion years", "4.5 billion years", "6.5 billion years", "8.5 billion years"], answer: 1 },
  ],
  history: [
    { q: "Who was the first US President?", options: ["John Adams", "Benjamin Franklin", "George Washington", "Thomas Jefferson"], answer: 2 },
    { q: "In what year did the Titanic sink?", options: ["1910", "1911", "1912", "1913"], answer: 2 },
    { q: "Which empire was ruled by Julius Caesar?", options: ["Greek", "Ottoman", "Roman", "Byzantine"], answer: 2 },
    { q: "The Berlin Wall fell in what year?", options: ["1987", "1988", "1989", "1990"], answer: 2 },
    { q: "Who painted the Mona Lisa?", options: ["Michelangelo", "Raphael", "Leonardo da Vinci", "Donatello"], answer: 2 },
    { q: "The French Revolution began in what year?", options: ["1776", "1783", "1789", "1799"], answer: 2 },
    { q: "Which country dropped the first atomic bomb?", options: ["USSR", "UK", "USA", "Germany"], answer: 2 },
    { q: "Who was the last pharaoh of ancient Egypt?", options: ["Nefertiti", "Cleopatra", "Hatshepsut", "Isis"], answer: 1 },
  ],
  movies: [
    { q: "Who played Iron Man in the MCU?", options: ["Chris Evans", "Chris Hemsworth", "Robert Downey Jr.", "Mark Ruffalo"], answer: 2 },
    { q: "In The Matrix, which pill does Neo take?", options: ["Blue", "Red", "Green", "Purple"], answer: 1 },
    { q: "Who directed Pulp Fiction?", options: ["Martin Scorsese", "Quentin Tarantino", "Christopher Nolan", "David Fincher"], answer: 1 },
    { q: "What year was the first Star Wars film released?", options: ["1975", "1976", "1977", "1978"], answer: 2 },
    { q: "Which movie features 'I see dead people'?", options: ["The Shining", "Poltergeist", "The Sixth Sense", "Beetlejuice"], answer: 2 },
    { q: "Who voiced Simba in the original Lion King?", options: ["Will Smith", "Eddie Murphy", "Matthew Broderick", "James Earl Jones"], answer: 2 },
    { q: "What sport is featured in Whiplash?", options: ["Piano", "Violin", "Drums", "Trumpet"], answer: 2 },
    { q: "In Breaking Bad, what's Walter White's street name?", options: ["The Cook", "Heisenberg", "El Jefe", "Blue Sky"], answer: 1 },
  ],
  sports: [
    { q: "How many players on a soccer team?", options: ["9", "10", "11", "12"], answer: 2 },
    { q: "Which country has won the most FIFA World Cups?", options: ["Germany", "Argentina", "Italy", "Brazil"], answer: 3 },
    { q: "How long is a standard marathon?", options: ["40km", "42.195km", "44km", "45km"], answer: 1 },
    { q: "In tennis, what comes after deuce?", options: ["Game", "Set", "Advantage", "Match"], answer: 2 },
    { q: "How many rings are on the Olympic flag?", options: ["4", "5", "6", "7"], answer: 1 },
    { q: "Michael Jordan played for which team?", options: ["LA Lakers", "Boston Celtics", "Chicago Bulls", "Miami Heat"], answer: 2 },
    { q: "How many points is a touchdown worth?", options: ["4", "5", "6", "7"], answer: 2 },
    { q: "Which sport uses a shuttlecock?", options: ["Squash", "Racquetball", "Badminton", "Pickleball"], answer: 2 },
  ],
  darkhumor: [
    { q: "What do you call a fish without eyes?", options: ["Blind fish", "Fsh", "A dead fish", "An eel"], answer: 1 },
    { q: "Why can't you hear a pterodactyl go to the bathroom?", options: ["Extinct", "The P is silent", "Sign language", "No bladders"], answer: 1 },
    { q: "What do you call cheese that isn't yours?", options: ["Stolen", "Nacho cheese", "Free cheese", "Borrowed dairy"], answer: 1 },
    { q: "Why don't scientists trust atoms?", options: ["Too small", "They make up everything", "No morals", "Split when stressed"], answer: 1 },
    { q: "Why did the scarecrow win an award?", options: ["Outstanding in his field", "Scared everyone", "Nobody else applied", "Great agent"], answer: 0 },
    { q: "I told my doctor I broke my arm in two places. He said?", options: ["Go to ER", "Stop going to those places", "File a lawsuit", "Take aspirin"], answer: 1 },
    { q: "What's the most dangerous part of a hospital?", options: ["The ICU", "The parking lot", "The gift shop prices", "The cafeteria"], answer: 2 },
    { q: "What do you call someone who can't stop buying carpets?", options: ["Floored", "Rugged", "Hooked", "A hoarder"], answer: 0 },
  ],
};

function getQs(cat) {
  const qs = QUESTIONS[cat] || QUESTIONS.general;
  return [...qs].sort(() => Math.random() - 0.5).slice(0, 8);
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res, parse(req.url, true)));
  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    socket.on("create_room", ({ nickname, category }) => {
      const code = generateCode();
      rooms[code] = { code, host: socket.id, hostName: nickname, players: {}, questions: getQs(category || "general"), currentQ: -1, started: false, timer: null, scores: {}, answered: {} };
      socket.join(code);
      socket.emit("room_created", { code });
    });

    socket.on("join_room", ({ code, nickname }) => {
      const room = rooms[code];
      if (!room) return socket.emit("error", "Room not found. Did you make that up?");
      if (room.started) return socket.emit("error", "Game already started. You're late. Classic.");
      room.players[socket.id] = { nickname, id: socket.id };
      room.scores[socket.id] = 0;
      socket.join(code);
      socket.emit("joined", { code, nickname });
      io.to(code).emit("players_update", Object.values(room.players));
    });

    socket.on("start_game", ({ code }) => {
      const room = rooms[code];
      if (!room || room.host !== socket.id) return;
      room.started = true; room.currentQ = 0;
      sendQuestion(io, room);
    });

    socket.on("next_question", ({ code }) => {
      const room = rooms[code];
      if (!room || room.host !== socket.id) return;
      if (room.timer) clearTimeout(room.timer);
      room.currentQ++;
      if (room.currentQ >= room.questions.length) endGame(io, room);
      else sendQuestion(io, room);
    });

    socket.on("submit_answer", ({ code, answerIndex, timeTaken }) => {
      const room = rooms[code];
      if (!room || room.answered[socket.id]) return;
      room.answered[socket.id] = true;
      const q = room.questions[room.currentQ];
      if (answerIndex === q.answer) {
        room.scores[socket.id] = (room.scores[socket.id] || 0) + 100 + Math.max(0, Math.floor((10000 - timeTaken) / 100));
      }
      socket.emit("answer_result", { correct: answerIndex === q.answer, correct_index: q.answer });
      const allAnswered = Object.keys(room.players).every(id => room.answered[id]);
      if (allAnswered) { if (room.timer) clearTimeout(room.timer); sendLeaderboard(io, room); }
      else io.to(room.host).emit("answer_count", { answeredCount: Object.values(room.answered).filter(Boolean).length, total: Object.keys(room.players).length });
    });

    socket.on("disconnect", () => {
      for (const code in rooms) {
        const room = rooms[code];
        if (room.host === socket.id) { io.to(code).emit("host_left"); if (room.timer) clearTimeout(room.timer); delete rooms[code]; }
        else if (room.players[socket.id]) { delete room.players[socket.id]; delete room.scores[socket.id]; io.to(code).emit("players_update", Object.values(room.players)); }
      }
    });
  });

  function sendQuestion(io, room) {
    room.answered = {};
    const q = room.questions[room.currentQ];
    io.to(room.code).emit("new_question", { question: q.q, options: q.options, index: room.currentQ, total: room.questions.length, timeLimit: 15 });
    room.timer = setTimeout(() => sendLeaderboard(io, room), 15000);
  }

  function sendLeaderboard(io, room) {
    const q = room.questions[room.currentQ];
    const leaderboard = Object.entries(room.scores).map(([id, score]) => ({ nickname: room.players[id]?.nickname || "?", score })).sort((a, b) => b.score - a.score);
    io.to(room.code).emit("leaderboard", { leaderboard, correct_index: q.answer, isLast: room.currentQ >= room.questions.length - 1 });
  }

  function endGame(io, room) {
    const final = Object.entries(room.scores).map(([id, score]) => ({ nickname: room.players[id]?.nickname || "?", score })).sort((a, b) => b.score - a.score);
    io.to(room.code).emit("game_over", { final });
    delete rooms[room.code];
  }

  httpServer.listen(3000, () => console.log("☠  QuizBlitz running on http://localhost:3000"));
});
