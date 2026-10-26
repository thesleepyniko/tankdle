CREATE TABLE "daily_mtcdle" (
	"date" date PRIMARY KEY NOT NULL,
	"puzzleId" integer GENERATED ALWAYS AS IDENTITY (sequence name "daily_mtcdle_puzzleId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"vehicle_slug" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rainyValleyVehicle" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"class" text NOT NULL,
	"role" text NOT NULL,
	"team" text NOT NULL,
	"image_url" text NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoke_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "solves" (
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"guesses" integer NOT NULL,
	"solved_at" timestamp with time zone,
	CONSTRAINT "solves_user_id_date_pk" PRIMARY KEY("user_id","date")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"discord_id" text NOT NULL,
	"username" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_discord_id_unique" UNIQUE("discord_id")
);
--> statement-breakpoint
CREATE TABLE "vehicle_metadata" (
	"game" text PRIMARY KEY NOT NULL,
	"last_synced" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vehicle" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"class" text NOT NULL,
	"role" text NOT NULL,
	"team" text NOT NULL,
	"image_url" text,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "daily_mtcdle" ADD CONSTRAINT "daily_mtcdle_vehicle_slug_vehicle_slug_fk" FOREIGN KEY ("vehicle_slug") REFERENCES "public"."vehicle"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves" ADD CONSTRAINT "solves_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves" ADD CONSTRAINT "solves_date_daily_mtcdle_date_fk" FOREIGN KEY ("date") REFERENCES "public"."daily_mtcdle"("date") ON DELETE no action ON UPDATE no action;