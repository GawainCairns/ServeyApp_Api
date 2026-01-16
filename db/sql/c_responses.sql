USE `serveysdb`;

CREATE TABLE IF NOT EXISTS `responses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `servey_id` INT NOT NULL,
  `question_id` INT NOT NULL,
  `answer` VARCHAR(500) NOT NULL,
  `responder_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_servey_id` (`servey_id`),
  KEY `idx_question_id` (`question_id`),
  CONSTRAINT `fk_responses_question` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_responses_servey` FOREIGN KEY (`servey_id`) REFERENCES `serveys`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;