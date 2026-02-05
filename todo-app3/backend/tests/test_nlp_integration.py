import unittest
from unittest.mock import Mock, patch
from backend.src.services.intent_detection import IntentDetectionService
from backend.src.services.context_manager import ContextManagerService
from backend.src.services.task_resolver import TaskResolverService
from backend.src.utils.nlp_utils import construct_assistant_response, sanitize_input, extract_keywords, calculate_similarity


class TestNLPIntegration(unittest.TestCase):
    """
    Integration tests for Natural Language Processing functionality.
    """

    def setUp(self):
        """
        Set up test fixtures before each test method.
        """
        self.intent_service = IntentDetectionService()
        self.context_service = ContextManagerService()
        self.task_resolver_service = TaskResolverService()

    def test_intent_detection_integration(self):
        """
        Test end-to-end intent detection and entity extraction.
        """
        # Test various natural language inputs
        test_inputs = [
            "Add a task to call mom at 3 PM",
            "What do I have to do today?",
            "Complete the first task",
            "Delete my meeting",
            "Update the grocery list to add milk"
        ]

        for user_input in test_inputs:
            with self.subTest(input=user_input):
                result = self.intent_service.detect_intent(user_input)

                # Verify the structure of the result
                self.assertIn("intent_type", result)
                self.assertIn("confidence", result)
                self.assertIn("extracted_entities", result)
                self.assertIn("raw_input", result)

                # Confidence should be a number between 0 and 1
                self.assertIsInstance(result["confidence"], (int, float))
                self.assertGreaterEqual(result["confidence"], 0.0)
                self.assertLessEqual(result["confidence"], 1.0)

                # Raw input should match original
                self.assertEqual(result["raw_input"], user_input)

    def test_intent_to_task_resolution_flow(self):
        """
        Test the flow from intent detection to task resolution.
        """
        # Mock user ID and conversation context for testing
        user_id = "test-user-123"
        conversation_context = {
            "previous_messages": [],
            "active_tasks": [],
            "recent_intents": []
        }

        # Test complete task intent with resolution
        user_input = "Complete the first task"
        intent_result = self.intent_service.detect_intent(user_input)

        # In a real scenario, this would resolve to an actual task
        # For this test, we're checking that the flow works even if resolution fails
        resolved_task = self.task_resolver_service.resolve_task_reference(
            "first task",
            user_id,
            conversation_context
        )

        # The intent should be detected properly
        self.assertIn("intent_type", intent_result)
        self.assertIn(intent_result["intent_type"], self.intent_service.get_supported_intents())

    def test_response_construction_from_intent(self):
        """
        Test constructing natural language responses from detected intents.
        """
        # Test different intent types with sample results
        intent_results = [
            {
                "intent_type": "ADD_TASK",
                "confidence": 0.9,
                "extracted_entities": {"title": "buy groceries", "due_time": "3 PM"},
                "raw_input": "Add a task to buy groceries at 3 PM"
            },
            {
                "intent_type": "LIST_TASKS",
                "confidence": 0.85,
                "extracted_entities": {},
                "raw_input": "Show me my tasks"
            },
            {
                "intent_type": "COMPLETE_TASK",
                "confidence": 0.92,
                "extracted_entities": {"task_reference": "first task"},
                "raw_input": "Complete the first task"
            }
        ]

        for intent_result in intent_results:
            with self.subTest(intent=intent_result["intent_type"]):
                response = construct_assistant_response(intent_result)

                # Response should be a non-empty string
                self.assertIsInstance(response, str)
                self.assertTrue(len(response) > 0)

    def test_input_sanitization_integration(self):
        """
        Test the sanitization of user inputs in the NLP pipeline.
        """
        # Test potentially problematic inputs
        test_inputs = [
            "Normal task to do",
            "Task with <script>alert('xss')</script> code",
            "SQL injection SELECT * FROM users",
            "Very long input " + "word " * 1000  # Long input test
        ]

        for user_input in test_inputs:
            with self.subTest(input=len(user_input)):
                sanitized = sanitize_input(user_input)

                # Sanitized input should be a string
                self.assertIsInstance(sanitized, str)

                # Should not contain dangerous patterns
                dangerous_patterns = [
                    "<script", "SELECT ", "DROP ", "DELETE ", "UNION ", "--", "/*"
                ]
                for pattern in dangerous_patterns:
                    self.assertNotIn(pattern.lower(), sanitized.lower())

                # Length should be reasonable
                self.assertLessEqual(len(sanitized), 1000)

    def test_keyword_extraction_integration(self):
        """
        Test extracting keywords from various types of inputs.
        """
        test_inputs = [
            "Add a task to call mom tomorrow",
            "Complete the meeting task",
            "Show me my urgent tasks",
            "Update my grocery list with milk and bread"
        ]

        for user_input in test_inputs:
            with self.subTest(input=user_input):
                keywords = extract_keywords(user_input)

                # Keywords should be a list
                self.assertIsInstance(keywords, list)

                # All elements should be strings
                for keyword in keywords:
                    self.assertIsInstance(keyword, str)

                # Should not contain stopwords
                stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
                for keyword in keywords:
                    self.assertNotIn(keyword.lower(), stop_words)

    def test_similarity_calculation(self):
        """
        Test calculating similarity between texts.
        """
        # Test similar texts
        text1 = "Add task to call mom"
        text2 = "Add task to call mother"

        similarity = calculate_similarity(text1, text2)

        # Should return a float between 0 and 1
        self.assertIsInstance(similarity, float)
        self.assertGreaterEqual(similarity, 0.0)
        self.assertLessEqual(similarity, 1.0)

        # Self-similarity should be 1.0
        self.assertEqual(calculate_similarity(text1, text1), 1.0)

        # Completely different texts should have low similarity
        dissimilar = calculate_similarity(text1, "xyz abc 123")
        self.assertLessEqual(dissimilar, 0.2)

    def test_task_attribute_identification(self):
        """
        Test identifying task attributes from user inputs.
        """
        test_inputs = [
            "Add a task to call mom at 3 PM",
            "Remind me to buy groceries tomorrow",
            "Schedule urgent meeting with team next week"
        ]

        for user_input in test_inputs:
            with self.subTest(input=user_input):
                attributes = self.intent_service.identify_task_attributes(user_input)

                # Should return a dictionary
                self.assertIsInstance(attributes, dict)

                # Should always have a title
                self.assertIn("title", attributes)
                self.assertIsInstance(attributes["title"], str)

                # Should have a priority
                self.assertIn("priority", attributes)
                self.assertIn(attributes["priority"], ["high", "medium", "low"])

    def test_end_to_end_nlp_pipeline(self):
        """
        Test the complete NLP pipeline: input -> sanitization -> intent detection -> response.
        """
        test_inputs = [
            "Add a task to call mom at 3 PM",
            "Show me my tasks",
            "Complete the first task",
            "Delete the meeting task"
        ]

        for user_input in test_inputs:
            with self.subTest(input=user_input):
                # Step 1: Sanitize input
                sanitized_input = sanitize_input(user_input)
                self.assertIsInstance(sanitized_input, str)

                # Step 2: Detect intent
                intent_result = self.intent_service.detect_intent(sanitized_input)
                self.assertIn("intent_type", intent_result)

                # Step 3: Construct response
                response = construct_assistant_response(intent_result)
                self.assertIsInstance(response, str)
                self.assertTrue(len(response) > 0)

                # Pipeline should complete without errors
                self.assertIsNotNone(intent_result)
                self.assertIsNotNone(response)


if __name__ == '__main__':
    unittest.main()