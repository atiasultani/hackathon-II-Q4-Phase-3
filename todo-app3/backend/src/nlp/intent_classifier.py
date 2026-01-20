"""
Intent classification module for the AI agent.
Implements more sophisticated natural language understanding for task management.
"""

from typing import Dict, List, Tuple, Optional
import re
from enum import Enum


class IntentType(Enum):
    ADD_TASK = "add_task"
    LIST_TASKS = "list_tasks"
    COMPLETE_TASK = "complete_task"
    UPDATE_TASK = "update_task"
    DELETE_TASK = "delete_task"
    UNKNOWN = "unknown"


class IntentClassifier:
    """
    Classifies user intents for task management based on natural language input.
    """

    def __init__(self):
        # Define patterns for different intents
        self.intent_patterns = {
            IntentType.ADD_TASK: [
                r'\b(add|create|make|set up|establish|put in|jot down|write down|record|save|remember to|remind me to|need to|have to|want to|plan to)\b',
                r'\b(new|another|more|additional)\s+(task|item|thing|todo|to-do)\b',
                r'\b(task|item|thing|todo|to-do)\s+(to|that|which|should)\s+(add|create|make|do|complete|finish)\b',
            ],
            IntentType.LIST_TASKS: [
                r'\b(show|display|list|see|view|look at|check|review|browse|get|fetch|tell me|what are|do i have)\s+(my\s+)?(tasks|todos|to-dos|items|things|list)\b',
                r'\b(my\s+)?(tasks|todos|to-dos|items|things|list)\b.*\b(are|is|do|show|list|display|see)\b',
                r'\b(what|anything|everything)\s+(else|left|remaining|outstanding|pending)\b',
                r'\b(don[e\']?t|don\'t|not)\s+know\s+(what|anything|much)',
            ],
            IntentType.COMPLETE_TASK: [
                r'\b(mark|set|make|flag|turn|change).*\b(complete|done|finished|closed|completed|over|wrap|wrapped)\b',
                r'\b(finish|complete|done|close|wrap up|get done|tick off|cross off|check off)\b',
                r'\b(done|completed|finished)\b',
                r'\b(check|tick|cross)\s+(off|out)\b',
            ],
            IntentType.UPDATE_TASK: [
                r'\b(update|change|modify|edit|alter|adjust|revise|improve|fix|correct)\b',
                r'\b(modify|rename|reword|rephrase|switch|swap|replace)\b',
                r'\b(change|update)\s+(the|a|an|this)\s+(task|title|description|item)\b',
            ],
            IntentType.DELETE_TASK: [
                r'\b(delete|remove|eliminate|get rid of|erase|clear|cancel|trash|dispose|drop|kill|nuke)\b',
                r'\b(remove|delete)\s+(the|a|an|this)\s+(task|item|entry|todo|to-do)\b',
                r'\b(gone|away|rid|rid of|out of|eliminate)\b.*\b(task|item|todo|to-do)\b',
            ]
        }

        # Entity extraction patterns
        self.entity_patterns = {
            'task_title': [
                r'(?:to|for|that|should|will|can|could|would)\s+(?!be|have|do|go)(\w+(?:\s+\w+){0,5})',
                r'(?:add|create|remember|note|put|make)\s+(?:a|an|the|some)?\s*(task|to|for)?\s*(\w+(?:\s+\w+){0,5})',
                r'(?:buy|get|do|make|call|send|write|read|watch|attend|go to|visit|clean|organize|prepare|cook|exercise|work on|study|learn|practice|plan|schedule)\s+(\w+(?:\s+\w+){0,4})',
            ],
            'task_description': [
                r'(?:because|so|in order|when|after|before|during|while|if|since)\s+(.+?)(?:\.|$|,)',
                r'(?:description|desc|detail|info|note|remark):\s*(.+?)(?:\.|$|,)',
            ],
            'task_priority': [
                r'\b(urgent|important|high|critical|top|priority|asap|soon|right away|immediately|now|first|before|early)\b',
                r'\b(low|normal|regular|standard|usual|typical)\b',
            ]
        }

    def classify_intent(self, text: str) -> Tuple[IntentType, float]:
        """
        Classify the intent of the user's input.

        Args:
            text: The user's input text

        Returns:
            Tuple of (intent_type, confidence_score)
        """
        text_lower = text.lower().strip()
        scores = {}

        # Calculate scores for each intent
        for intent, patterns in self.intent_patterns.items():
            score = 0
            for pattern in patterns:
                matches = re.findall(pattern, text_lower)
                score += len(matches)  # Each match adds to the score

            # Additional heuristics
            if intent == IntentType.ADD_TASK:
                # Look for action words typically associated with adding
                if any(word in text_lower for word in ['buy', 'call', 'email', 'write', 'schedule', 'plan', 'organize']):
                    score += 1
            elif intent == IntentType.LIST_TASKS:
                # Questions often mean user wants to see tasks
                if '?' in text:
                    score += 1
                if any(word in text_lower for word in ['what', 'how many', 'show', 'list']):
                    score += 1
            elif intent == IntentType.COMPLETE_TASK:
                # Completion words
                if any(word in text_lower for word in ['done', 'finished', 'completed', 'cross', 'check']):
                    score += 1

            scores[intent] = score

        # Find the intent with the highest score
        if max(scores.values()) > 0:
            best_intent = max(scores.keys(), key=lambda x: scores[x])
            total_score = sum(scores.values())
            confidence = scores[best_intent] / total_score if total_score > 0 else 0
            return best_intent, min(confidence, 1.0)
        else:
            return IntentType.UNKNOWN, 0.0

    def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """
        Extract entities from the user's input.

        Args:
            text: The user's input text

        Returns:
            Dictionary of extracted entities
        """
        text_lower = text.lower().strip()
        entities = {}

        for entity_type, patterns in self.entity_patterns.items():
            extracted_values = []
            for pattern in patterns:
                matches = re.findall(pattern, text_lower)
                for match in matches:
                    # Handle tuple matches (groups in regex)
                    if isinstance(match, tuple):
                        match = match[-1]  # Take the last group which is usually the actual content
                    if match and match.strip():
                        extracted_values.append(match.strip())

            entities[entity_type] = list(set(extracted_values))  # Remove duplicates

        return entities

    def parse_add_task_request(self, text: str) -> Dict[str, Optional[str]]:
        """
        Parse a request to add a task and extract relevant details.

        Args:
            text: The user's input text

        Returns:
            Dictionary with task details (title, description, etc.)
        """
        entities = self.extract_entities(text)

        # Look for task title in various positions
        title = None

        # Check for explicit title patterns
        for pattern in self.entity_patterns['task_title']:
            matches = re.findall(pattern, text.lower())
            for match in matches:
                if isinstance(match, tuple):
                    match = match[-1]  # Take the last captured group
                if match and match.strip() and len(match.strip()) > 1:
                    title = match.strip().capitalize()
                    break
            if title:
                break

        # If no title found from patterns, try to extract the main action
        if not title:
            # Look for common task-starting verbs
            verb_patterns = [
                r'(?:to|need to|have to|want to|should|must|will|going to)\s+(buy|call|email|write|schedule|plan|organize|prepare|cook|exercise|work on|study|learn|practice|clean|read|watch|attend|go to|visit|take out|pick up|drop off|wash|do|make|buy|get|finish|complete|create|setup|arrange|book|order|research|think about|focus on)\s+(\w+(?:\s+\w+){0,4})',
                r'(?:add|create|remember|note|put|make|set|jot down|write down)\s+(?:a|an|the|some)?\s*(?:task|to|for)?\s*(\w+(?:\s+\w+){0,5})',
            ]

            for pattern in verb_patterns:
                matches = re.findall(pattern, text.lower())
                for match in matches:
                    if isinstance(match, tuple):
                        # For the first pattern, combine verb + object
                        if len(match) >= 2 and match[0] and match[1]:
                            title = f"{match[0]} {match[1]}".strip().capitalize()
                            break
                        # For other patterns, take the first non-empty group
                        for m in match:
                            if m and len(m.strip()) > 1:
                                title = m.strip().capitalize()
                                break
                    else:
                        if match and len(match.strip()) > 1:
                            title = match.strip().capitalize()
                            break
                if title:
                    break

        # Fallback: use the entire input as title if nothing else works
        if not title and len(text.strip()) > 0:
            title = text.strip().capitalize()

        return {
            "title": title,
            "description": entities.get('task_description', [None])[0] if entities.get('task_description') else None
        }


# Singleton instance
intent_classifier = IntentClassifier()


def get_intent_and_entities(text: str) -> Tuple[IntentType, float, Dict[str, List[str]]]:
    """
    Convenience function to get both intent and entities for a given text.

    Args:
        text: The user's input text

    Returns:
        Tuple of (intent_type, confidence_score, entities_dict)
    """
    intent, confidence = intent_classifier.classify_intent(text)
    entities = intent_classifier.extract_entities(text)
    return intent, confidence, entities