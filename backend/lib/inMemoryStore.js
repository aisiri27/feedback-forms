const users = [];
const forms = [];
const responses = [];
const events = [];
const eventFeedback = [];

function makeId() {
  const hex = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < 24; i += 1) {
    out += hex[Math.floor(Math.random() * hex.length)];
  }
  return out;
}

function nowIso() {
  return new Date().toISOString();
}

module.exports = {
  users,
  forms,
  responses,
  events,
  eventFeedback,
  makeId,
  nowIso,
};
