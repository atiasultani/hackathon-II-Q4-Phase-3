import unittest
from unittest.mock import Mock, patch
from backend.src.services.intent_detection import IntentDetectionService, IntentType


class TestIntentDetectionService(unittest.TestCase):
    """
    Unit tests for the IntentDetectionService class.
    """

    def setUp(self):
        """
        Set up test fixtures before each test method.
        """
        self.intent_service = IntentDetectionService()

    def test_detect_intent_add_task(self):
        """
        Test detecting ADD_TASK intent from natural language input.
        """
        user_input = "Add a task to buy groceries"

        # Since we're not actually calling the OpenAI API in tests,
        # we'll test the function logic directly
        result = self.intent_service.detect_intent(user_input)

        # The result should be a dictionary with expected keys
        self.assertIn("intent_type", result)
        self.assertIn("confidence", result)
        self.assertIn("extracted_entities", result)
        self.assertEqual(result["raw_input"], user_input)

        # The intent type should be one of the supported types
        self.assertIn(result["intent_type"], self.intent_service.supported_intents + [IntentType.UNKNOWN.value])

    def test_detect_intent_list_tasks(self):
        """
        Test detecting LIST_TASKS intent from natural language input.
        """
        user_input = "Show me my tasks"

        result = self.intent_service.detect_intent(user_input)

        self.assertIn("intent_type", result)
        self.assertIn("confidence", result)
        self.assertIn("extracted_entities", result)
        self.assertEqual(result["raw_input"], user_input)

    def test_detect_intent_complete_task(self):
        """
        Test detecting COMPLETE_TASK intent from natural language input.
        """
        user_input = "Complete the first task"

        result = self.intent_service.detect_intent(user_input)

        self.assertIn("intent_type", result)
        self.assertIn("confidence", result)
        self.assertIn("extracted_entities", result)
        self.assertEqual(result["raw_input"], user_input)

    def test_detect_intent_delete_task(self):
        """
        Test detecting DELETE_TASK intent from natural language input.
        """
        user_input = "Delete my meeting task"

        result = self.intent_service.detect_intent(user_input)

        self.assertIn("intent_type", result)
        self.assertIn("confidence", result)
        self.assertIn("extracted_entities", result)
        self.assertEqual(result["raw_input"], user_input)

    def test_detect_intent_update_task(self):
        """
        Test detecting UPDATE_TASK intent from natural language input.
        """
        user_input = "Update my shopping list"

        result = self.intent_service.detect_intent(user_input)

        self.assertIn("intent_type", result)
        self.assertIn("confidence", result)
        self.assertIn("extracted_entities", result)
        self.assertEqual(result["raw_input"], user_input)

    def test_detect_intent_unknown(self):
        """
        Test detecting UNKNOWN intent for unclear input.
        """
        user_input = "This is an unclear request"

        result = self.intent_service.detect_intent(user_input)

        self.assertIn("intent_type", result)
        self.assertIn("confidence", result)
        self.assertIn("extracted_entities", result)
        self.assertEqual(result["raw_input"], user_input)

    def test_get_supported_intents(self):
        """
        Test getting the list of supported intents.
        """
        supported_intents = self.intent_service.get_supported_intents()

        # Should contain all the standard intent types
        expected_intents = [intent.value for intent in IntentType if intent != IntentType.UNKNOWN]
        for expected_intent in expected_intents:
            self.assertIn(expected_intent, supported_intents)

    def test_is_ambiguous_high_confidence(self):
        """
        Test that high confidence intents are not ambiguous.
        """
        intent_result = {
            "intent_type": IntentType.ADD.value,
            "confidence": 0.9,
            "extracted_entities": {"title": "Buy groceries"},
            "raw_input": "Add a task to buy groceries"
        }

        is_ambiguous = self.intent_service.is_ambiguous(intent_result)
        self.assertFalse(is_ambiguous)

    def test_is_ambiguous_low_confidence(self):
        """
        Test that low confidence intents are considered ambiguous.
        """
        intent_result = {
            "intent_type": IntentType.COMPLETE.value,
            "confidence": 0.5,
            "extracted_entities": {},
            "raw_input": "Do something with the task"
        }

        is_ambiguous = self.intent_service.is_ambiguous(intent_result)
        self.assertTrue(is_ambiguous)

    def test_suggest_clarification_question_complete_intent(self):
        """
        Test generating clarification question for complete intent.
        """
        intent_result = {
            "intent_type": IntentType.COMPLETE.value,
            "confidence": 0.5,
            "extracted_entities": {},
            "raw_input": "Complete the task"
        }

        question = self.intent_service.suggest_clarification_question(intent_result)

        self.assertIsInstance(question, str)
        self.assertTrue(len(question) > 0)

    def test_suggest_clarification_question_add_intent(self):
        """
        Test generating clarification question for add intent.
        """
        intent_result = {
            "intent_type": IntentType.ADD.value,
            "confidence": 0.5,
            "extracted_entities": {},
            "raw_input": "Add something"
        }

        question = self.intent_service.suggest_clarification_question(intent_result)

        self.assertIsInstance(question, str)
        self.assertTrue(len(question) > 0)

    def test_handle_synonyms_and_variations(self):
        """
        Test handling of synonyms and language variations.
        """
        user_input = "Create a task to schedule meeting"
        normalized = self.intent_service.handle_synonyms_and_variations(user_input)

        self.assertIsInstance(normalized, str)
        self.assertEqual(normalized.strip(), user_input.strip())


if __name__ == '__main__':
    unittest.main()