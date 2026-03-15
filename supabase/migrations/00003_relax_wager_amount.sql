-- Relax wager amount constraint for fixed voting system
alter table public.wagers drop constraint wagers_amount_check;
alter table public.wagers add constraint wagers_amount_check check (amount > 0);
