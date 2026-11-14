-- RLS Test Suite for FMI: Proves User A cannot read or write User B's data
-- Can be executed via psql or Supabase SQL Editor

BEGIN;

-- 1. Create two test UUIDs simulating auth.users
DO $$
DECLARE
    v_user_a UUID := '11111111-1111-1111-1111-111111111111';
    v_user_b UUID := '22222222-2222-2222-2222-222222222222';
    v_interview_a UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    v_turn_a UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    v_report_a UUID := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    v_count INTEGER;
BEGIN
    RAISE NOTICE '=== STARTING RLS ISOLATION TESTS ===';

    -- Simulate inserting User A's interview directly with User A context
    -- In Supabase, auth.uid() reads current_setting('request.jwt.claim.sub', true)::uuid
    PERFORM set_config('request.jwt.claim.sub', v_user_a::text, true);
    PERFORM set_config('role', 'authenticated', true);

    -- Insert interview for User A
    INSERT INTO interviews (id, user_id, target_role, difficulty, status, livekit_room_name)
    VALUES (v_interview_a, v_user_a, 'Frontend Developer', 'fresher', 'setup', 'room-user-a-123');

    -- Insert turn for User A's interview
    INSERT INTO interview_turns (id, interview_id, turn_number, round, interviewer_question, user_transcript)
    VALUES (v_turn_a, v_interview_a, 1, 'warmup', 'Tell me about yourself.', 'I am an aspiring engineer.');

    -- Insert report for User A
    INSERT INTO reports (id, interview_id, user_id, overall_score, communication_score, technical_score, body_language_score, summary)
    VALUES (v_report_a, v_interview_a, v_user_a, 85, 80, 90, 85, 'Solid performance.');

    -- Verify User A CAN read their own interview
    SELECT COUNT(*) INTO v_count FROM interviews WHERE id = v_interview_a;
    IF v_count <> 1 THEN
        RAISE EXCEPTION 'TEST FAILED: User A cannot read their own interview!';
    END IF;
    RAISE NOTICE '✓ PASS: User A can read their own interview';

    -- Verify User A CAN read their own turn
    SELECT COUNT(*) INTO v_count FROM interview_turns WHERE id = v_turn_a;
    IF v_count <> 1 THEN
        RAISE EXCEPTION 'TEST FAILED: User A cannot read their own turn!';
    END IF;
    RAISE NOTICE '✓ PASS: User A can read their own turn';

    -- 2. NOW SWITCH CONTEXT TO USER B
    PERFORM set_config('request.jwt.claim.sub', v_user_b::text, true);

    -- User B tries to SELECT User A's interview
    SELECT COUNT(*) INTO v_count FROM interviews WHERE id = v_interview_a;
    IF v_count <> 0 THEN
        RAISE EXCEPTION 'SECURITY BREACH: User B read User A interview! Count: %', v_count;
    END IF;
    RAISE NOTICE '✓ PASS: User B cannot read User A interview (0 rows returned)';

    -- User B tries to SELECT User A's turn
    SELECT COUNT(*) INTO v_count FROM interview_turns WHERE id = v_turn_a;
    IF v_count <> 0 THEN
        RAISE EXCEPTION 'SECURITY BREACH: User B read User A interview turn! Count: %', v_count;
    END IF;
    RAISE NOTICE '✓ PASS: User B cannot read User A interview turn (0 rows returned)';

    -- User B tries to SELECT User A's report
    SELECT COUNT(*) INTO v_count FROM reports WHERE id = v_report_a;
    IF v_count <> 0 THEN
        RAISE EXCEPTION 'SECURITY BREACH: User B read User A report! Count: %', v_count;
    END IF;
    RAISE NOTICE '✓ PASS: User B cannot read User A report (0 rows returned)';

    -- User B tries to UPDATE User A's interview
    UPDATE interviews SET status = 'abandoned' WHERE id = v_interview_a;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count <> 0 THEN
        RAISE EXCEPTION 'SECURITY BREACH: User B updated User A interview! Updated rows: %', v_count;
    END IF;
    RAISE NOTICE '✓ PASS: User B cannot update User A interview (0 rows affected)';

    -- User B tries to DELETE User A's interview
    DELETE FROM interviews WHERE id = v_interview_a;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count <> 0 THEN
        RAISE EXCEPTION 'SECURITY BREACH: User B deleted User A interview! Deleted rows: %', v_count;
    END IF;
    RAISE NOTICE '✓ PASS: User B cannot delete User A interview (0 rows affected)';

    RAISE NOTICE '=== ALL RLS ISOLATION TESTS PASSED PERFECTLY ===';
END $$;

ROLLBACK; -- Always rollback so test data does not persist

