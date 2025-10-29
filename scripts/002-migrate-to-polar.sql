-- Migrate from Stripe to Polar.sh
-- Rename stripe columns to polar columns

ALTER TABLE subscriptions 
  RENAME COLUMN stripe_customer_id TO polar_customer_id;

ALTER TABLE subscriptions 
  RENAME COLUMN stripe_subscription_id TO polar_subscription_id;
