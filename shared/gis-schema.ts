import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  uuid,
  serial,
  geometry
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// ====== الهيكل الجغرافي الإداري لليمن ======

// المحافظات - Governorates
export const governorates = pgTable("gis_governorates", {
  id: serial("id").primaryKey(),
  nameAr: varchar("name_ar", { length: 100 }).notNull(),
  nameEn: varchar("name_en", { length: 100 }),
  code: varchar("code", { length: 10 }).unique().notNull(),
  capitalCity: varchar("capital_city", { length: 100 }),
  
  // البيانات الجغرافية
  geometry: geometry("geom", { type: "polygon", srid: 4326 }),
  area: decimal("area_sqkm", { precision: 12, scale: 6 }), // المساحة بالكيلومتر المربع
  
  // البيانات الإدارية
  governor: varchar("governor", { length: 255 }),
  population: integer("population"),
  isActive: boolean("is_active").default(true),
  
  // الأوصاف والملاحظات
  description: text("description"),
  economicActivity: jsonb("economic_activity").$type<{
    agriculture?: number;
    industry?: number;
    services?: number;
    tourism?: number;
  }>(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("governorates_code_idx").on(table.code),
  index("governorates_geom_idx").on(table.geometry),
]);

// المديريات - Districts  
export const districts = pgTable("gis_districts", {
  id: serial("id").primaryKey(),
  governorateId: integer("governorate_id").references(() => governorates.id).notNull(),
  
  nameAr: varchar("name_ar", { length: 100 }).notNull(),
  nameEn: varchar("name_en", { length: 100 }),
  code: varchar("code", { length: 15 }).unique().notNull(),
  
  // البيانات الجغرافية
  geometry: geometry("geom", { type: "polygon", srid: 4326 }),
  area: decimal("area_sqkm", { precision: 12, scale: 6 }),
  
  // البيانات الإدارية
  director: varchar("director", { length: 255 }),
  population: integer("population"),
  urbanPercentage: decimal("urban_percentage", { precision: 5, scale: 2 }),
  
  // الخدمات المتوفرة
  services: jsonb("services").$type<{
    hospitals?: number;
    schools?: number;
    policeStations?: number;
    postOffices?: number;
  }>(),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("districts_governorate_idx").on(table.governorateId),
  index("districts_code_idx").on(table.code),
  index("districts_geom_idx").on(table.geometry),
]);

// العزل - Sub-Districts
export const subDistricts = pgTable("gis_sub_districts", {
  id: serial("id").primaryKey(),
  districtId: integer("district_id").references(() => districts.id).notNull(),
  
  nameAr: varchar("name_ar", { length: 100 }).notNull(),
  nameEn: varchar("name_en", { length: 100 }),
  code: varchar("code", { length: 20 }).unique().notNull(),
  
  // البيانات الجغرافية
  geometry: geometry("geom", { type: "polygon", srid: 4326 }),
  area: decimal("area_sqkm", { precision: 12, scale: 6 }),
  
  // البيانات الإدارية
  chiefName: varchar("chief_name", { length: 255 }),
  population: integer("population"),
  householdsCount: integer("households_count"),
  
  // نوع العزلة
  subDistrictType: varchar("sub_district_type", { length: 50 }).default("rural"), // rural, urban, mixed
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("sub_districts_district_idx").on(table.districtId),
  index("sub_districts_code_idx").on(table.code),
  index("sub_districts_geom_idx").on(table.geometry),
]);

// القطاعات - Sectors
export const sectors = pgTable("gis_sectors", {
  id: serial("id").primaryKey(),
  subDistrictId: integer("sub_district_id").references(() => subDistricts.id).notNull(),
  
  nameAr: varchar("name_ar", { length: 100 }).notNull(),
  nameEn: varchar("name_en", { length: 100 }),
  code: varchar("code", { length: 25 }).unique().notNull(),
  
  // البيانات الجغرافية
  geometry: geometry("geom", { type: "polygon", srid: 4326 }),
  area: decimal("area_sqkm", { precision: 12, scale: 6 }),
  
  // نوع القطاع
  sectorType: varchar("sector_type", { length: 50 }).notNull(), 
  // residential, commercial, industrial, mixed, agricultural, institutional
  
  // الكثافة السكانية
  population: integer("population"),
  buildingDensity: varchar("building_density", { length: 20 }), // low, medium, high
  
  // الخدمات والمرافق
  infrastructure: jsonb("infrastructure").$type<{
    electricity?: boolean;
    water?: boolean;
    sewerage?: boolean;
    internet?: boolean;
    publicTransport?: boolean;
  }>(),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("sectors_sub_district_idx").on(table.subDistrictId),
  index("sectors_code_idx").on(table.code),
  index("sectors_type_idx").on(table.sectorType),
  index("sectors_geom_idx").on(table.geometry),
]);

// وحدات الجوار - Neighborhood Units
export const neighborhoodUnits = pgTable("gis_neighborhood_units", {
  id: serial("id").primaryKey(),
  sectorId: integer("sector_id").references(() => sectors.id).notNull(),
  
  nameAr: varchar("name_ar", { length: 100 }).notNull(),
  nameEn: varchar("name_en", { length: 100 }),
  code: varchar("code", { length: 30 }).unique().notNull(),
  
  // البيانات الجغرافية
  geometry: geometry("geom", { type: "polygon", srid: 4326 }),
  area: decimal("area_sqm", { precision: 12, scale: 2 }), // بالمتر المربع
  
  // خصائص وحدة الجوار
  unitType: varchar("unit_type", { length: 50 }).notNull(),
  // residential, commercial, mixed, institutional, recreational
  
  population: integer("population"),
  householdsCount: integer("households_count"),
  buildingsCount: integer("buildings_count"),
  
  // الخدمات المحلية
  localServices: jsonb("local_services").$type<{
    mosque?: boolean;
    school?: boolean;
    clinic?: boolean;
    market?: boolean;
    playground?: boolean;
    garden?: boolean;
  }>(),
  
  // البيانات التخطيطية
  planningStatus: varchar("planning_status", { length: 50 }).default("approved"),
  // approved, pending, under_review, violated
  
  maxBuildingHeight: integer("max_building_height"), // بالطوابق
  coverageRatio: decimal("coverage_ratio", { precision: 5, scale: 2 }), // نسبة التغطية
  floorAreaRatio: decimal("floor_area_ratio", { precision: 5, scale: 2 }), // نسبة البناء
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("neighborhood_units_sector_idx").on(table.sectorId),
  index("neighborhood_units_code_idx").on(table.code),
  index("neighborhood_units_type_idx").on(table.unitType),
  index("neighborhood_units_geom_idx").on(table.geometry),
]);

// البلوكات - Blocks
export const blocks = pgTable("gis_blocks", {
  id: serial("id").primaryKey(),
  neighborhoodUnitId: integer("neighborhood_unit_id").references(() => neighborhoodUnits.id).notNull(),
  
  blockNumber: varchar("block_number", { length: 20 }).notNull(),
  blockCode: varchar("block_code", { length: 35 }).unique().notNull(),
  
  // البيانات الجغرافية
  geometry: geometry("geom", { type: "polygon", srid: 4326 }),
  area: decimal("area_sqm", { precision: 12, scale: 2 }),
  
  // نوع الاستخدام
  landUse: varchar("land_use", { length: 50 }).notNull(),
  // residential, commercial, industrial, institutional, recreational, mixed, vacant
  
  // الخصائص التفصيلية
  buildingType: varchar("building_type", { length: 50 }),
  // villa, apartment, office, shop, warehouse, factory, school, hospital, mosque
  
  plotsCount: integer("plots_count").default(0),
  builtPlotsCount: integer("built_plots_count").default(0),
  totalBuiltArea: decimal("total_built_area", { precision: 12, scale: 2 }),
  
  // البيانات التنظيمية  
  zoning: varchar("zoning", { length: 50 }),
  maxHeight: integer("max_height_floors"),
  setbackFront: decimal("setback_front", { precision: 5, scale: 2 }),
  setbackSide: decimal("setback_side", { precision: 5, scale: 2 }),
  setbackRear: decimal("setback_rear", { precision: 5, scale: 2 }),
  
  // حالة البلوك
  developmentStatus: varchar("development_status", { length: 50 }).default("available"),
  // available, under_development, completed, violated
  
  ownershipType: varchar("ownership_type", { length: 50 }),
  // private, government, waqf, mixed
  
  // الملاحظات والوصف
  description: text("description"),
  specialConditions: text("special_conditions"),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("blocks_neighborhood_unit_idx").on(table.neighborhoodUnitId),
  index("blocks_number_idx").on(table.blockNumber),
  index("blocks_code_idx").on(table.blockCode),
  index("blocks_land_use_idx").on(table.landUse),
  index("blocks_geom_idx").on(table.geometry),
]);

// الشوارع - Streets
export const streets = pgTable("gis_streets", {
  id: serial("id").primaryKey(),
  
  nameAr: varchar("name_ar", { length: 200 }),
  nameEn: varchar("name_en", { length: 200 }),
  streetCode: varchar("street_code", { length: 30 }).unique(),
  
  // البيانات الجغرافية
  geometry: geometry("geom", { type: "linestring", srid: 4326 }),
  length: decimal("length_meters", { precision: 10, scale: 2 }),
  
  // نوع وخصائص الشارع
  streetType: varchar("street_type", { length: 50 }).notNull(),
  // main_arterial, secondary_arterial, collector, local, alley, pedestrian
  
  streetClass: varchar("street_class", { length: 30 }).notNull(),
  // primary, secondary, tertiary, local
  
  width: decimal("width_meters", { precision: 6, scale: 2 }),
  surfaceType: varchar("surface_type", { length: 30 }),
  // asphalt, concrete, gravel, dirt
  
  // الاتجاهات والمرور
  direction: varchar("direction", { length: 20 }).default("both"),
  // both, one_way_forward, one_way_reverse
  
  speedLimit: integer("speed_limit_kmh"),
  trafficLoad: varchar("traffic_load", { length: 20 }),
  // light, moderate, heavy
  
  // الخدمات والمرافق
  streetLighting: boolean("street_lighting").default(false),
  sidewalks: boolean("sidewalks").default(false),
  parking: boolean("parking_allowed").default(true),
  publicTransport: boolean("public_transport").default(false),
  
  // شبكات المرافق
  utilities: jsonb("utilities").$type<{
    electricity?: boolean;
    water?: boolean;
    sewerage?: boolean;
    telecommunications?: boolean;
    gas?: boolean;
  }>(),
  
  // حالة الشارع
  condition: varchar("condition", { length: 30 }).default("good"),
  // excellent, good, fair, poor, very_poor
  
  constructionYear: integer("construction_year"),
  lastMaintenanceDate: timestamp("last_maintenance_date"),
  
  // البيانات الإدارية
  responsibility: varchar("responsibility", { length: 100 }),
  // ministry_of_public_works, municipality, local_council
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("streets_type_idx").on(table.streetType),
  index("streets_class_idx").on(table.streetClass),
  index("streets_code_idx").on(table.streetCode),
  index("streets_geom_idx").on(table.geometry),
]);

// جدول ربط الشوارع بوحدات الجوار (العلاقة many-to-many)
export const streetNeighborhoodBoundaries = pgTable("gis_street_neighborhood_boundaries", {
  id: serial("id").primaryKey(),
  streetId: integer("street_id").references(() => streets.id).notNull(),
  neighborhoodUnitId: integer("neighborhood_unit_id").references(() => neighborhoodUnits.id).notNull(),
  
  boundaryType: varchar("boundary_type", { length: 30 }).notNull(),
  // main_boundary, internal, partial
  
  segmentGeometry: geometry("segment_geom", { type: "linestring", srid: 4326 }),
  segmentLength: decimal("segment_length", { precision: 10, scale: 2 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("street_neighborhood_street_idx").on(table.streetId),
  index("street_neighborhood_unit_idx").on(table.neighborhoodUnitId),
  index("street_neighborhood_boundary_idx").on(table.boundaryType),
]);

// ====== العلاقات Relations ======
export const governoratesRelations = relations(governorates, ({ many }) => ({
  districts: many(districts),
}));

export const districtsRelations = relations(districts, ({ one, many }) => ({
  governorate: one(governorates, {
    fields: [districts.governorateId],
    references: [governorates.id],
  }),
  subDistricts: many(subDistricts),
}));

export const subDistrictsRelations = relations(subDistricts, ({ one, many }) => ({
  district: one(districts, {
    fields: [subDistricts.districtId],
    references: [districts.id],
  }),
  sectors: many(sectors),
}));

export const sectorsRelations = relations(sectors, ({ one, many }) => ({
  subDistrict: one(subDistricts, {
    fields: [sectors.subDistrictId],
    references: [subDistricts.id],
  }),
  neighborhoodUnits: many(neighborhoodUnits),
}));

export const neighborhoodUnitsRelations = relations(neighborhoodUnits, ({ one, many }) => ({
  sector: one(sectors, {
    fields: [neighborhoodUnits.sectorId],
    references: [sectors.id],
  }),
  blocks: many(blocks),
  streetBoundaries: many(streetNeighborhoodBoundaries),
}));

export const blocksRelations = relations(blocks, ({ one }) => ({
  neighborhoodUnit: one(neighborhoodUnits, {
    fields: [blocks.neighborhoodUnitId],
    references: [neighborhoodUnits.id],
  }),
}));

export const streetsRelations = relations(streets, ({ many }) => ({
  neighborhoodBoundaries: many(streetNeighborhoodBoundaries),
}));

export const streetNeighborhoodBoundariesRelations = relations(streetNeighborhoodBoundaries, ({ one }) => ({
  street: one(streets, {
    fields: [streetNeighborhoodBoundaries.streetId],
    references: [streets.id],
  }),
  neighborhoodUnit: one(neighborhoodUnits, {
    fields: [streetNeighborhoodBoundaries.neighborhoodUnitId],
    references: [neighborhoodUnits.id],
  }),
}));

// ====== Zod Schemas للتحقق من البيانات ======
export const insertGovernorateSchema = createInsertSchema(governorates);
export const insertDistrictSchema = createInsertSchema(districts);
export const insertSubDistrictSchema = createInsertSchema(subDistricts);
export const insertSectorSchema = createInsertSchema(sectors);
export const insertNeighborhoodUnitSchema = createInsertSchema(neighborhoodUnits);
export const insertBlockSchema = createInsertSchema(blocks);
export const insertStreetSchema = createInsertSchema(streets);
export const insertStreetNeighborhoodBoundarySchema = createInsertSchema(streetNeighborhoodBoundaries);

// Types
export type Governorate = typeof governorates.$inferSelect;
export type InsertGovernorate = typeof governorates.$inferInsert;
export type District = typeof districts.$inferSelect;
export type InsertDistrict = typeof districts.$inferInsert;
export type SubDistrict = typeof subDistricts.$inferSelect;
export type InsertSubDistrict = typeof subDistricts.$inferInsert;
export type Sector = typeof sectors.$inferSelect;
export type InsertSector = typeof sectors.$inferInsert;
export type NeighborhoodUnit = typeof neighborhoodUnits.$inferSelect;
export type InsertNeighborhoodUnit = typeof neighborhoodUnits.$inferInsert;
export type Block = typeof blocks.$inferSelect;
export type InsertBlock = typeof blocks.$inferInsert;
export type Street = typeof streets.$inferSelect;
export type InsertStreet = typeof streets.$inferInsert;
export type StreetNeighborhoodBoundary = typeof streetNeighborhoodBoundaries.$inferSelect;
export type InsertStreetNeighborhoodBoundary = typeof streetNeighborhoodBoundaries.$inferInsert;