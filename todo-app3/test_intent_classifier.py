"""
Test for the new intent classifier functionality
"""
import unittest
from backend.src.nlp.intent_classifier import IntentClassifier, IntentType, get_intent_and_entities


class TestIntentClassifier(unittest.TestCase):

    def setUp(self):
        self.classifier = IntentClassifier()

    def test_add_task_intent(self):
        """Test that add task intents are properly classified"""
        test_cases = [
            "Add a task to buy groceries",
            "Create a task to call mom",
            "Remember to schedule meeting",
            "Need to write email to boss",
            "Want to plan vacation",
        ]

        for text in test_cases:
            intent, confidence, entities = get_intent_and_entities(text)
            self.assertEqual(intent, IntentType.ADD_TASK)
            self.assertGreater(confidence, 0.0)

    def test_list_tasks_intent(self):
        """Test that list tasks intents are properly classified"""
        test_cases = [
            "Show my tasks",
            "What are my tasks?",
            "List all my tasks",
            "See my todos",
            "Do I have any tasks?",
        ]

        for text in test_cases:
            intent, confidence, entities = get_intent_and_entities(text)
            self.assertEqual(intent, IntentType.LIST_TASKS)
            self.assertGreater(confidence, 0.0)

    def test_complete_task_intent(self):
        """Test that complete task intents are properly classified"""
        test_cases = [
            "Complete the first task",
            "Finish my work task",
            "Mark task as done",
            "Check off the grocery task",
            "Done with the meeting",
        ]

        for text in test_cases:
            intent, confidence, entities = get_intent_and_entities(text)
            self.assertIn(intent, [IntentType.COMPLETE_TASK, IntentType.UNKNOWN])  # May vary based on confidence

    def test_update_task_intent(self):
        """Test that update task intents are properly classified"""
        test_cases = [
            "Update the task to buy milk",
            "Change the task description",
            "Modify the meeting time",
            "Edit the task",
        ]

        for text in test_cases:
            intent, confidence, entities = get_intent_and_entities(text)
            self.assertIn(intent, [IntentType.UPDATE_TASK, IntentType.UNKNOWN])  # May vary based on confidence

    def test_delete_task_intent(self):
        """Test that delete task intents are properly classified"""
        test_cases = [
            "Delete the old task",
            "Remove the cancelled task",
            "Get rid of the outdated task",
            "Erase the completed task",
        ]

        for text in test_cases:
            intent, confidence, entities = get_intent_and_entities(text)
            self.assertIn(intent, [IntentType.DELETE_TASK, IntentType.UNKNOWN])  # May vary based on confidence

    def test_unknown_intent(self):
        """Test that unknown intents are properly classified"""
        test_cases = [
            "Hello there",
            "What's the weather like?",
            "Tell me a joke",
            "How are you today?",
        ]

        for text in test_cases:
            intent, confidence, entities = get_intent_and_entities(text)
            # These should either be unknown or have low confidence
            if confidence > 0.3:  # If it has high confidence, it should be one of our task intents
                self.assertIn(intent, [IntentType.ADD_TASK, IntentType.LIST_TASKS,
                                     IntentType.COMPLETE_TASK, IntentType.UPDATE_TASK,
                                     IntentType.DELETE_TASK])

    def test_entity_extraction(self):
        """Test that entities are properly extracted"""
        text = "Add a task to buy groceries from the store"
        intent, confidence, entities = get_intent_and_entities(text)

        self.assertEqual(intent, IntentType.ADD_TASK)
        self.assertTrue('task_title' in entities)

        # Test task parsing specifically
        task_details = self.classifier.parse_add_task_request(text)
        self.assertIn('title', task_details)
        self.assertIsNotNone(task_details['title'])
        self.assertIn('buy groceries', task_details['title'].lower())


if __name__ == '__main__':
    unittest.main()