import numpy as np
from typing import List, Optional
from sentence_transformers import SentenceTransformer
from app.core.config import settings
import asyncio

class EmbeddingService:
    def __init__(self):
        self.model_name = settings.MODEL_NAME
        self.model = None
        self.embedding_dimension = settings.EMBEDDING_DIMENSION
        self._load_model()
    
    def _load_model(self):
        try:
            print(f"Loading embedding model: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)
            print(f"Model loaded successfully. Embedding dimension: {self.model.get_sentence_embedding_dimension()}")
        except Exception as e:
            print(f"Error loading embedding model: {e}")
            print("Falling back to basic text processing")
            self.model = None
    
    async def get_embeddings(self, texts: List[str]) -> np.ndarray:
        if not texts:
            return np.array([])
        
        try:
            if self.model is None:
                # Fallback to basic processing
                return self._basic_embeddings(texts)
            
            # Clean and prepare texts
            cleaned_texts = [self._preprocess_text(text) for text in texts]
            
            # Generate embeddings
            embeddings = self.model.encode(cleaned_texts, convert_to_numpy=True)
            
            return embeddings
            
        except Exception as e:
            print(f"Error generating embeddings: {e}")
            # Fallback to basic processing
            return self._basic_embeddings(texts)
    
    async def get_single_embedding(self, text: str) -> np.ndarray:
        embeddings = await self.get_embeddings([text])
        return embeddings[0] if len(embeddings) > 0 else np.array([])
    
    async def compute_similarity(self, text1: str, text2: str) -> float:
        try:
            embeddings = await self.get_embeddings([text1, text2])
            
            if len(embeddings) < 2:
                return 0.0
            
            # Compute cosine similarity
            similarity = self._cosine_similarity(embeddings[0], embeddings[1])
            return float(similarity)
            
        except Exception as e:
            print(f"Error computing similarity: {e}")
            return 0.0
    
    async def compute_similarities(self, query_text: str, candidate_texts: List[str]) -> List[float]:
        try:
            all_texts = [query_text] + candidate_texts
            embeddings = await self.get_embeddings(all_texts)
            
            if len(embeddings) < 2:
                return [0.0] * len(candidate_texts)
            
            query_embedding = embeddings[0]
            candidate_embeddings = embeddings[1:]
            
            similarities = []
            for candidate_embedding in candidate_embeddings:
                similarity = self._cosine_similarity(query_embedding, candidate_embedding)
                similarities.append(float(similarity))
            
            return similarities
            
        except Exception as e:
            print(f"Error computing similarities: {e}")
            return [0.0] * len(candidate_texts)
    
    def _preprocess_text(self, text: str) -> str:
        if not text:
            return ""
        
        # Basic text cleaning
        text = text.strip()
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        # Truncate if too long (sentence-transformers have limits)
        max_length = 512  # Conservative limit
        if len(text) > max_length:
            text = text[:max_length]
        
        return text
    
    def _cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        try:
            # Normalize vectors
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            # Compute cosine similarity
            similarity = np.dot(vec1, vec2) / (norm1 * norm2)
            
            # Ensure result is in [-1, 1] range
            similarity = np.clip(similarity, -1.0, 1.0)
            
            return float(similarity)
            
        except Exception as e:
            print(f"Error computing cosine similarity: {e}")
            return 0.0
    
    def _basic_embeddings(self, texts: List[str]) -> np.ndarray:
        try:
            embeddings = []
            for text in texts:
                # Create a simple feature vector based on text characteristics
                text_lower = text.lower()
                
                # Basic features
                length = len(text)
                word_count = len(text.split())
                char_count = len(text.replace(' ', ''))
                
                # Simple keyword presence features
                tech_keywords = ['python', 'javascript', 'java', 'react', 'node', 'sql', 'aws']
                keyword_features = [1.0 if keyword in text_lower else 0.0 for keyword in tech_keywords]
                
                # Combine features
                features = [length, word_count, char_count] + keyword_features
                
                # Normalize features
                features = np.array(features, dtype=np.float32)
                features = features / (np.linalg.norm(features) + 1e-8)
                
                embeddings.append(features)
            
            return np.array(embeddings)
            
        except Exception as e:
            print(f"Error in basic embeddings: {e}")
            # Return zero embeddings as last resort
            return np.zeros((len(texts), 10), dtype=np.float32)
    
    def get_model_info(self) -> dict:
        if self.model is None:
            return {
                "model_name": "none",
                "embedding_dimension": 0,
                "status": "not_loaded"
            }
        
        return {
            "model_name": self.model_name,
            "embedding_dimension": self.model.get_sentence_embedding_dimension(),
            "status": "loaded"
        }
