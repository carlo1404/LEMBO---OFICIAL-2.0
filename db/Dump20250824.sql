-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: sistema_gestion_agricola
-- ------------------------------------------------------
-- Server version	9.3.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ciclo_cultivo`
--

DROP TABLE IF EXISTS `ciclo_cultivo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ciclo_cultivo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `periodo_inicio` date NOT NULL,
  `periodo_final` date NOT NULL,
  `novedades` text COLLATE utf8mb4_unicode_ci,
  `usuario_id` int DEFAULT NULL,
  `estado` enum('habilitado','deshabilitado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'habilitado',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `ciclo_cultivo_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ciclo_cultivo`
--

LOCK TABLES `ciclo_cultivo` WRITE;
/*!40000 ALTER TABLE `ciclo_cultivo` DISABLE KEYS */;
INSERT INTO `ciclo_cultivo` VALUES (1,'Ciclo Primavera 2024','Ciclo de cultivos de primavera con siembra de hortalizas de hoja','2024-03-01','2024-06-30','Excelente germinación debido a condiciones climáticas favorables',1,'habilitado','2025-07-08 23:14:34'),(2,'Ciclo Verano 2024','Cultivos de verano resistentes al calor y con alta demanda de agua','2024-06-01','2024-09-30','Implementación de sistema de nebulización para control de temperatura',2,'habilitado','2025-07-08 23:14:34'),(3,'Ciclo Otoño 2024','Siembra de cultivos de clima fresco y preparación para invierno','2024-09-01','2024-12-31','Introducción de variedades resistentes a bajas temperaturas',3,'habilitado','2025-07-08 23:14:34'),(4,'Ciclo Invierno 2024-2025','Cultivos protegidos en invernadero durante temporada fría','2024-12-01','2025-03-31','Uso intensivo de calefacción y control de humedad',1,'habilitado','2025-07-08 23:14:34'),(5,'Ciclo Experimental 2024','Pruebas con nuevas variedades y técnicas de cultivo','2024-04-15','2024-08-15','Evaluación de rendimiento de semillas híbridas importadas',4,'habilitado','2025-07-08 23:14:34'),(6,'Ciclo Orgánico 2024','Producción completamente orgánica sin químicos sintéticos','2024-05-01','2024-10-31','Certificación orgánica obtenida, excelente respuesta del mercado',2,'habilitado','2025-07-08 23:14:34'),(7,'Ciclo Hidropónico 2024','Cultivos en sistema hidropónico con nutrición controlada','2024-02-15','2024-07-15','Optimización de fórmulas nutritivas para cada etapa de crecimiento',3,'habilitado','2025-07-08 23:14:34'),(8,'Ciclo Aromáticas 2024','Especialización en plantas aromáticas y medicinales','2024-03-15','2024-09-15','Alta demanda de productos aromáticos en mercados gourmet',1,'habilitado','2025-07-08 23:14:34'),(9,'Ciclo Intensivo 2024','Producción intensiva con múltiples cosechas por año','2024-01-01','2024-12-31','Implementación de técnicas de cultivo continuo',4,'habilitado','2025-07-08 23:14:34'),(10,'Ciclo Semillero 2024','Producción especializada de plántulas para venta','2024-02-01','2024-11-30','Expansión del negocio de venta de plántulas a otros productores',2,'habilitado','2025-07-08 23:14:34');
/*!40000 ALTER TABLE `ciclo_cultivo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cultivos`
--

DROP TABLE IF EXISTS `cultivos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cultivos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ubicacion` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuario_id` int DEFAULT NULL,
  `tamano` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('habilitado','deshabilitado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'habilitado',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `cultivos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cultivos`
--

LOCK TABLES `cultivos` WRITE;
/*!40000 ALTER TABLE `cultivos` DISABLE KEYS */;
INSERT INTO `cultivos` VALUES (1,'Huerta de Tomates','Hortalizas','Invernadero A1','Cultivo de tomates cherry en sistema hidropónico con control climático',1,'5','deshabilitado','2025-07-08 23:14:22'),(2,'Cultivo de Lechugas','Hortalizas','Campo Abierto B2','Producción de lechuga crespa en campo abierto con riego por goteo',2,'300 m²','habilitado','2025-07-08 23:14:22'),(3,'Plantación de Cilantro','Aromáticas','Invernadero C3','Cultivo intensivo de cilantro para mercado local',3,'200 m²','habilitado','2025-07-08 23:14:22'),(4,'Huerta de Zanahorias','Hortalizas','Campo Abierto D4','Cultivo de zanahorias en suelo franco con rotación de cultivos',1,'800 m²','habilitado','2025-07-08 23:14:22'),(5,'Cultivo de Rábanos','Hortalizas','Túnel E5','Producción de rábanos rojos en túnel con ventilación natural',4,'150 m²','habilitado','2025-07-08 23:14:22'),(6,'Huerta Mixta','Mixto','Campo Abierto F6','Cultivo diversificado con diferentes hortalizas de temporada',2,'1000 m²','habilitado','2025-07-08 23:14:22'),(7,'Aromáticas Medicinales','Aromáticas','Invernadero G7','Cultivo especializado en plantas aromáticas y medicinales',3,'400 m²','habilitado','2025-07-08 23:14:22'),(8,'Vivero de Plántulas','Vivero','Invernadero H8','Producción de plántulas para trasplante en diferentes cultivos',1,'250 m²','habilitado','2025-07-08 23:14:22'),(9,'Cultivo Orgánico','Hortalizas','Campo Abierto I9','Producción orgánica certificada sin uso de químicos sintéticos',4,'600 m²','habilitado','2025-07-08 23:14:22'),(10,'Hidroponía Vertical','Hortalizas','Invernadero J10','Sistema de cultivo vertical hidropónico de alta tecnología',2,'350 m²','habilitado','2025-07-08 23:14:22'),(11,'agua','Hortalizas','Invernadero A1','nose',1,'50 m²','deshabilitado','2025-08-25 00:16:09'),(12,'smckillua','Hortalizas','Invernadero A1','213123asd',1,'50 m²','deshabilitado','2025-08-25 01:33:17');
/*!40000 ALTER TABLE `cultivos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `insumos`
--

DROP TABLE IF EXISTS `insumos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `insumos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unidad_medida` enum('peso','volumen','superficie','concentración','litro','kilo') COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `cantidad` int NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuario_id` int DEFAULT NULL,
  `estado` enum('habilitado','deshabilitado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'habilitado',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_usuario_id` (`usuario_id`),
  CONSTRAINT `fk_usuario_id` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `insumos`
--

LOCK TABLES `insumos` WRITE;
/*!40000 ALTER TABLE `insumos` DISABLE KEYS */;
INSERT INTO `insumos` VALUES (1,'Fertilizante NPK 15-15-15','Fertilizante','kilo',25000.00,100,'Fertilizante completo con nitrógeno, fósforo y potasio para cultivos generales',1,'habilitado','2025-07-08 23:14:01'),(2,'Semillas de Tomate Cherr','Pesticida','kilo',15000.00,50,'Semillas híbridas de tomate cherry de alta productividad',2,'habilitado','2025-07-08 23:14:01'),(3,'Insecticida Orgánicos','Pesticida','litro',35000.00,25,'Insecticida a base de extractos naturales para control de plagas',1,'habilitado','2025-07-08 23:14:01'),(4,'Sustrato para Germinación','Sustrato','kilo',8000.00,200,'Mezcla especial de turba y perlita para germinación de semillas',3,'deshabilitado','2025-07-08 23:14:01'),(5,'Fungicida Preventivo','Fungicida','litro',42000.00,15,'Fungicida sistémico para prevención de enfermedades fúngicas',2,'habilitado','2025-07-08 23:14:01'),(6,'Semillas de Lechuga','Semilla','peso',12000.00,75,'Semillas de lechuga crespa variedad resistente',1,'habilitado','2025-07-08 23:14:01'),(7,'Abono Orgánico Compost','Abono','kilo',5000.00,500,'Compost orgánico rico en materia orgánica y micronutrientes',4,'habilitado','2025-07-08 23:14:01'),(8,'Herbicida Selectivo','Herbicida','litro',28000.00,20,'Herbicida selectivo para control de malezas en hortalizas',3,'habilitado','2025-07-08 23:14:01'),(9,'Semillas de Cilantro','Semilla','peso',8000.00,40,'Semillas de cilantro aromático de crecimiento rápido',2,'habilitado','2025-07-08 23:14:01'),(10,'Fertilizante Foliar','Fertilizante','litro',18000.00,40,'Fertilizante líquido para aplicación foliar con micronutrientes',1,'habilitado','2025-07-08 23:14:01'),(11,'Cal Agrícola','Corrector','kilo',3000.00,300,'Cal dolomítica para corrección de pH del suelo',4,'deshabilitado','2025-07-08 23:14:01'),(12,'Semillas de Zanahoria','Semilla','peso',14000.00,45,'Semillas de zanahoria variedad Nantes de raíz cilíndrica',3,'habilitado','2025-07-08 23:14:01'),(13,'Bioestimulante Radicular','Bioestimulante','litro',32000.00,12,'Estimulante natural para desarrollo del sistema radicular',2,'habilitado','2025-07-08 23:14:01'),(14,'Mulch Orgánico','Cobertura','kilo',4000.00,150,'Cobertura orgánica para conservación de humedad y control de malezas',1,'habilitado','2025-07-08 23:14:01'),(15,'Semillas de Rábano','Semilla','peso',9000.00,80,'Semillas de rábano rojo de crecimiento rápido',4,'habilitado','2025-07-08 23:14:01');
/*!40000 ALTER TABLE `insumos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `producciones`
--

DROP TABLE IF EXISTS `producciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `producciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ubicacion` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuario_id` int DEFAULT NULL,
  `estado` enum('habilitado','deshabilitado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'habilitado',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `cultivo_id` int DEFAULT NULL,
  `ciclo_id` int DEFAULT NULL,
  `insumos_ids` text COLLATE utf8mb4_unicode_ci,
  `sensores_ids` text COLLATE utf8mb4_unicode_ci,
  `fecha_de_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `inversion` decimal(10,2) DEFAULT NULL,
  `meta_ganancia` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ciclo_id` (`ciclo_id`),
  KEY `cultivo_id` (`cultivo_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `producciones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `producciones_ibfk_2` FOREIGN KEY (`cultivo_id`) REFERENCES `cultivos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `producciones_ibfk_3` FOREIGN KEY (`ciclo_id`) REFERENCES `ciclo_cultivo` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `producciones`
--

LOCK TABLES `producciones` WRITE;
/*!40000 ALTER TABLE `producciones` DISABLE KEYS */;
INSERT INTO `producciones` VALUES (1,'Producción Tomates Cherry Q1','Hortalizas','Invernadero A1','Primera producción de tomates cherry del año con sistema hidropónico',1,'habilitado','2025-07-08 23:15:18',1,1,'[1,4,10]','[1,4,8]','2024-03-01','2024-05-30',2500000.00,4000000.00),(2,'Cosecha Lechugas Primavera','Hortalizas','Campo Abierto B2','Producción de lechugas crespas para mercado local',2,'habilitado','2025-07-08 23:15:18',2,1,'[6,7,11]','[2,5]','2024-03-15','2024-05-15',800000.00,1500000.00),(3,'Cultivo Cilantro Aromático','Aromáticas','Invernadero C3','Producción intensiva de cilantro para restaurantes',3,'habilitado','2025-07-08 23:15:18',3,7,'[9,13,14]','[3,7]','2024-02-20','2024-04-20',600000.00,1200000.00),(4,'Zanahorias Campo Abierto','Hortalizas','Campo Abierto D4','Cultivo tradicional de zanahorias con rotación',1,'habilitado','2025-07-08 23:15:18',4,2,'[12,1,11]','[1,9]','2024-06-01','2024-09-01',1200000.00,2200000.00),(5,'Rábanos Túnel Protegido','Hortalizas','Túnel E5','Producción rápida de rábanos en ambiente controlado',4,'habilitado','2025-07-08 23:15:18',5,1,'[15,7,10]','[4,6]','2024-03-10','2024-04-25',400000.00,800000.00),(7,'Aromáticas Medicinales Premium','Aromáticas','Invernadero G7','Cultivo especializado en plantas medicinales de alta calidad',3,'habilitado','2025-07-08 23:15:18',7,8,'[9,13,10]','[7,10]','2024-03-15','2024-08-15',1000000.00,2000000.00),(8,'Vivero Plántulas Comercial','Vivero','Invernadero H8','Producción masiva de plántulas para venta',1,'habilitado','2025-07-08 23:15:18',8,9,'[2,6,9,12,15]','[1,4,8]','2024-02-01','2024-11-30',1500000.00,3000000.00),(9,'Producción Orgánica Certificada','Hortalizas','Campo Abierto I9','Cultivo orgánico certificado sin químicos sintéticos',4,'habilitado','2025-07-08 23:15:18',9,6,'[7,14,11]','[2,9,11]','2024-05-01','2024-09-30',2000000.00,3800000.00),(10,'Hidroponía Vertical Tecnificada','Hortalizas','Invernadero J10','Sistema vertical de alta tecnología con automatización',2,'habilitado','2025-07-08 23:15:18',10,7,'[1,4,10,13]','[1,4,5,8,10]','2024-02-15','2024-06-15',3000000.00,5500000.00);
/*!40000 ALTER TABLE `producciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sensores`
--

DROP TABLE IF EXISTS `sensores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sensores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipo_sensor` enum('Sensor de contacto','Sensor de distancia','Sensores de luz') COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_sensor` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unidad_medida` enum('Temperatura','Distancia','Presión') COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `tiempo_escaneo` enum('Sensores lentos','Sensores de velocidad media','Sensores rápidos') COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuario_id` int DEFAULT NULL,
  `estado` enum('habilitado','deshabilitado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'habilitado',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_sensor_usuario_id` (`usuario_id`),
  CONSTRAINT `fk_sensor_usuario_id` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sensores`
--

LOCK TABLES `sensores` WRITE;
/*!40000 ALTER TABLE `sensores` DISABLE KEYS */;
INSERT INTO `sensores` VALUES (2,'Sensores de luz','Fotosensor Lumínico FL-02','Temperatura','Sensor de intensidad lumínica para control de iluminació','Sensores rápidos',2,'deshabilitado','2025-07-08 23:14:49'),(3,'Sensor de distancia','Sensor Ultrasónico Nivel SU-03','Distancia','Medición de nivel de agua en tanques de riego','Sensores lentos',3,'deshabilitado','2025-07-08 23:14:49'),(4,'Sensor de contacto','Termómetro Digital TD-04','Temperatura','Sensor de temperatura ambiente con precisión de 0.1°C','Sensores de velocidad media',1,'deshabilitado','2025-07-08 23:14:49'),(5,'Sensor de contacto','Higrómetro Capacitivo HC-05','Presión','Medición de humedad relativa del aire en invernaderos','Sensores rápidos',4,'habilitado','2025-07-08 23:14:49'),(6,'Sensor de distancia','Sensor de Proximidad SP-06','Distancia','Detección de presencia para sistemas automatizados','Sensores rápidos',2,'habilitado','2025-07-08 23:14:49'),(7,'Sensores de luz','Sensor UV Radiación SR-07','Temperatura','Medición de radiación ultravioleta para protección de cultivos','Sensores de velocidad media',3,'habilitado','2025-07-08 23:14:49'),(8,'Sensor de contacto','pH-metro Digital PH-08','Presión','Medición continua de pH en soluciones nutritivas','Sensores lentos',1,'habilitado','2025-07-08 23:14:49'),(9,'Sensor de distancia','Sensor de Crecimiento SC-09','Distancia','Monitoreo del crecimiento vertical de plantas','Sensores de velocidad media',4,'habilitado','2025-07-08 23:14:49'),(10,'Sensores de luz','Luxómetro Digital LD-10','Temperatura','Medición precisa de intensidad lumínica en lux','Sensores rápidos',2,'habilitado','2025-07-08 23:14:49'),(11,'Sensor de contacto','Conductímetro CE-11','Presión','Medición de conductividad eléctrica en soluciones','Sensores de velocidad media',3,'habilitado','2025-07-08 23:14:49'),(12,'Sensor de distancia','Sensor de Viento SV-12','Distancia','Medición de velocidad y dirección del viento','Sensores lentos',1,'habilitado','2025-07-08 23:14:49'),(14,'Sensor de contacto','Sensor de Humedad de Suelo SH-0','Distancia','23123asdad','Sensores lentos',6,'habilitado','2025-08-25 02:10:05');
/*!40000 ALTER TABLE `sensores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipo_documento` enum('ti','cc','ppt','ce','pep') COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero_documento` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `correo` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rol` enum('superadmin','admin','apoyo','visitante') COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('habilitado','deshabilitado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'habilitado',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero_documento` (`numero_documento`),
  UNIQUE KEY `correo` (`correo`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'cc','12345678','Juan Carlos Pérez','3001234567','juan.perez@email.com','superadmin','deshabilitado','2025-07-08 23:13:41'),(2,'cc','87654321','María González','3009876543','maria.gonzalez@email.com','admin','habilitado','2025-07-08 23:13:41'),(3,'cc','11223344','Carlos Rodríguez','3001122334','carlos.rodriguez@email.com','admin','habilitado','2025-07-08 23:13:41'),(4,'ti','98765432','Ana Sofía López','3002345678','ana.lopez@email.com','apoyo','habilitado','2025-07-08 23:13:41'),(5,'cc','55667788','Pedro Martínez','3005566778','pedro.martinez@email.com','apoyo','habilitado','2025-07-08 23:13:41'),(6,'ce','44556677','Luis Fernando Silva','3004455667','luis.silva@email.com','visitante','habilitado','2025-07-08 23:13:41'),(7,'cc','33445566','Carmen Jiménez','3003344556','carmen.jimenez@email.com','admin','deshabilitado','2025-07-08 23:13:41'),(8,'ppt','22334455','Roberto Vargas','3002233445','roberto.vargas@email.com','apoyo','habilitado','2025-07-08 23:13:41'),(9,'cc','66778899','Lucía Herrera','3006677889','lucia.herrera@email.com','visitante','habilitado','2025-07-08 23:13:41'),(10,'cc','99887766','Diego Morales','3009988776','diego.morales@email.com','admin','habilitado','2025-07-08 23:13:41'),(12,'cc','123456789','Juan Pérez','3001234567','juan.perez@example.com','admin','habilitado','2025-08-25 01:27:40');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-24 22:59:25
