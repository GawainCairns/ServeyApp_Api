USE `serveysdb`;

-- Test data for ServeyApp
-- This script truncates tables and inserts sample rows for development/testing.

SET FOREIGN_KEY_CHECKS=0;
TRUNCATE TABLE `responses`;
TRUNCATE TABLE `answers`;
TRUNCATE TABLE `questions`;
TRUNCATE TABLE `serveys`;
TRUNCATE TABLE `users`;
SET FOREIGN_KEY_CHECKS=1;

-- Insert users: one regular user and one admin
INSERT INTO `users` (`name`, `email`, `password`, `role`) VALUES
  ('Test User','user@example.com','password123','user'),
  ('Admin User','admin@example.com','adminpass','admin');

-- Insert 2 serveys per user (total 4)
INSERT INTO `serveys` (`name`, `discription`, `creator`, `s_code`) VALUES
  ('User1 Survey A','Survey A for Test User', 1, 'USR1_SURV_A_0001'),
  ('User1 Survey B','Survey B for Test User', 1, 'USR1_SURV_B_0002'),
  ('Admin Survey A','Survey A for Admin User', 2, 'ADM_SURV_A_0003'),
  ('Admin Survey B','Survey B for Admin User', 2, 'ADM_SURV_B_0004');

-- Insert 3 text questions per survey (4 surveys * 3 = 12 questions)
INSERT INTO `questions` (`servey_id`, `question`, `type`) VALUES
  (1, 'What do you like most about our product?', 'text'),
  (1, 'What would you improve?', 'text'),
  (1, 'Any additional comments?', 'text'),

  (2, 'How did you hear about us?', 'text'),
  (2, 'Which features do you use the most?', 'text'),
  (2, 'What stopped you from using other features?', 'text'),

  (3, 'How satisfied are you with support?', 'text'),
  (3, 'What could support improve?', 'text'),
  (3, 'Any support success stories?', 'text'),

  (4, 'Rate documentation usefulness', 'text'),
  (4, 'Where did you find documentation unclear?', 'text'),
  (4, 'Suggestions for documentation?', 'text');

-- Insert some sample answers for questions (optional; answers table may be used for predefined choices)
INSERT INTO `answers` (`question_id`) VALUES
  ((SELECT id FROM questions WHERE question='How did you hear about us?' LIMIT 1)),
  ((SELECT id FROM questions WHERE question='How did you hear about us?' LIMIT 1)),
  ((SELECT id FROM questions WHERE question='Which features do you use the most?' LIMIT 1)),
  ((SELECT id FROM questions WHERE question='Which features do you use the most?' LIMIT 1));

-- Insert some sample responses from user 1 to survey 1
INSERT INTO `responses` (`servey_id`, `question_id`, `answer`, `responder_id`) VALUES
  (1, (SELECT id FROM questions WHERE servey_id=1 ORDER BY id LIMIT 1), 'I like the speed and simplicity', 1),
  (1, (SELECT id FROM questions WHERE servey_id=1 ORDER BY id LIMIT 1 OFFSET 1), 'A better mobile layout', 1),
  (1, (SELECT id FROM questions WHERE servey_id=1 ORDER BY id LIMIT 1 OFFSET 2), 'No further comments', 1);

-- Insert some sample responses from admin (user 2) to survey 3
INSERT INTO `responses` (`servey_id`, `question_id`, `answer`, `responder_id`) VALUES
  (3, (SELECT id FROM questions WHERE servey_id=3 ORDER BY id LIMIT 1), 'Mostly satisfied', 2),
  (3, (SELECT id FROM questions WHERE servey_id=3 ORDER BY id LIMIT 1 OFFSET 1), 'Faster ticket routing', 2),
  (3, (SELECT id FROM questions WHERE servey_id=3 ORDER BY id LIMIT 1 OFFSET 2), 'No particular story', 2);

-- End of test data
