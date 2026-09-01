-- ZeroCorp 0008 — the server remembers which question it asked.
--
-- The interview's answer endpoint took the QuestionCard from the client, which means the
-- client decided which slot its answer was written into. Validating the card proves it
-- is well formed; it does not prove it is the card that was actually asked.
--
-- It is not a cross-tenant hole -- a visitor can only reach their own assessment -- but
-- it lets a crafted request write into any slot, skip the interview and reach the
-- analysis with answers nobody was asked for. A server that cannot say what question it
-- asked cannot check the answer it gets back.
--
-- It also fixes a real bug: on reload the service had to guess the pending question from
-- the first unfilled slot, which is wrong the moment the interviewer asks anything
-- adaptive, and wrong for every `confirm`.

alter table assessments add column if not exists pending_question jsonb;
