USE `serveysdb`;

CREATE TABLE `serveys` (
    `id` int NOT NULL AUTO_INCREMENT,
    `name` varchar(255) DEFAULT NULL,
    `email` varchar(2000) DEFAULT NULL,
    `creator` varchar(100) DEFAULT NULL,
    PRIMARY KEY (`id`)
)