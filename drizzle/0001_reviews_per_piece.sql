ALTER TABLE "reviews" DROP CONSTRAINT "reviews_order_id_unique";--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "demo_session_id" text;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "demo_expires_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "reviews_piece_idx" ON "reviews" USING btree ("piece_id");--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_piece_unique" UNIQUE("order_id","piece_id");