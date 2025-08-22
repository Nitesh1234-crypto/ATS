import numpy as np
from typing import Dict, List, Any, Tuple
from fuzzywuzzy import fuzz
from app.schemas.scoring import ParsedResume, ParsedJD
from app.core.config import settings
import re

class ScoringEngine:
    def __init__(self):
        self.weights = {
            'keyword_match': settings.KEYWORD_MATCH_WEIGHT,
            'skills': settings.SKILLS_WEIGHT,
            'experience': settings.EXPERIENCE_WEIGHT,
            'education': settings.EDUCATION_WEIGHT,
            'formatting': settings.FORMATTING_WEIGHT
        }
        
        # dictionary for skills
        self.skill_synonyms = {
            'aws': ['amazon web services', 'amazon', 'ec2', 's3', 'lambda'],
            'javascript': ['js', 'ecmascript'],
            'python': ['py'],
            'react': ['reactjs', 'react.js'],
            'node.js': ['nodejs', 'node'],
            'typescript': ['ts'],
            'html': ['html5'],
            'css': ['css3'],
            'sql': ['mysql', 'postgresql', 'postgres', 'oracle', 'sql server'],
            'docker': ['containerization'],
            'kubernetes': ['k8s', 'kube'],
            'git': ['version control', 'github', 'gitlab'],
            'agile': ['scrum', 'kanban', 'lean'],
            'machine learning': ['ml', 'ai', 'artificial intelligence'],
            'data science': ['data analytics', 'data analysis']
        }
    
    async def score_resume(
        self,
        parsed_resume: ParsedResume,
        parsed_jd: ParsedJD,
        resume_embeddings: np.ndarray,
        jd_embeddings: np.ndarray
    ) -> Dict[str, Any]:
        
        try:
            # Compute sub-scores
            keyword_score = await self._compute_keyword_match_score(parsed_resume, parsed_jd)
            skills_score = await self._compute_skills_score(parsed_resume, parsed_jd)
            experience_score = await self._compute_experience_score(parsed_resume, parsed_jd)
            education_score = await self._compute_education_score(parsed_resume, parsed_jd)
            formatting_score = await self._compute_formatting_score(parsed_resume)
            
            # Compute overall score
            overall_score = self._compute_overall_score({
                'keyword_match': keyword_score['score'],
                'skills': skills_score['score'],
                'experience': experience_score['score'],
                'education': education_score['score'],
                'formatting': formatting_score['score']
            })
            
            # Generate suggestions
            suggestions = await self._generate_suggestions(
                parsed_resume, parsed_jd, keyword_score, skills_score, 
                experience_score, formatting_score
            )
            return {
                'overall_score': overall_score,
                'scores': {
                    'keyword_match': keyword_score['score'],
                    'skills': skills_score['score'],
                    'experience': experience_score['score'],
                    'education': education_score['score'],
                    'formatting': formatting_score['score']
                },
                'matched_keywords': keyword_score['matched_keywords'],
                'missing_keywords': keyword_score['missing_keywords'],
                'skills': skills_score['skills_data'],
                'experience': experience_score['experience_data'],
                'formatting_issues': formatting_score['issues'],
                'suggestions': suggestions,
                'explanations': self._generate_explanations(
                    keyword_score, skills_score, experience_score, 
                    education_score, formatting_score
                ),
                'confidence': self._compute_confidence(
                    keyword_score, skills_score, experience_score, 
                    education_score, formatting_score
                )
            }
            
        except Exception as e:
            raise Exception(f"Error in scoring engine: {str(e)}")
    
    async def _compute_keyword_match_score(
        self, 
        parsed_resume: ParsedResume, 
        parsed_jd: ParsedJD
    ) -> Dict[str, Any]:
        
        # Extract keywords from JD
        jd_keywords = self._extract_jd_keywords(parsed_jd)
        
        # Match keywords against resume
        matched_keywords = []
        missing_keywords = []
        
        for keyword_info in jd_keywords:
            keyword = keyword_info['keyword']
            importance = keyword_info['importance']
            
            if self._keyword_exists_in_resume(keyword, parsed_resume):
                matched_keywords.append(keyword)
            else:
                missing_keywords.append({
                    'keyword': keyword,
                    'importance': importance
                })
        
        # Calculate score
        total_keywords = len(jd_keywords)
        if total_keywords == 0:
            score = 100
        else:
            # Weight by importance
            required_matches = sum(1 for k in matched_keywords if k in [kw['keyword'] for kw in jd_keywords if kw['importance'] == 'required'])
            preferred_matches = sum(1 for k in matched_keywords if k in [kw['keyword'] for kw in jd_keywords if kw['importance'] == 'preferred'])
            nice_matches = sum(1 for k in matched_keywords if k in [kw['keyword'] for kw in jd_keywords if kw['importance'] == 'nice-to-have'])
            
            required_total = sum(1 for kw in jd_keywords if kw['importance'] == 'required')
            preferred_total = sum(1 for kw in jd_keywords if kw['importance'] == 'preferred')
            nice_total = sum(1 for kw in jd_keywords if kw['importance'] == 'nice-to-have')
            
            score = 0
            if required_total > 0:
                score += (required_matches / required_total) * 50
            if preferred_total > 0:
                score += (preferred_matches / preferred_total) * 30
            if nice_total > 0:
                score += (nice_matches / nice_total) * 20
        
        return {
            'score': int(score),
            'matched_keywords': matched_keywords,
            'missing_keywords': missing_keywords
        }
    
    async def _compute_skills_score(
        self, 
        parsed_resume: ParsedResume, 
        parsed_jd: ParsedJD
    ) -> Dict[str, Any]:
        
        resume_skills = set(skill.lower() for skill in parsed_resume.skills)
        jd_skills = set(skill.lower() for skill in parsed_jd.skills)
        
        # Expand skills using synonyms
        expanded_resume_skills = self._expand_skills_with_synonyms(resume_skills)
        expanded_jd_skills = self._expand_skills_with_synonyms(jd_skills)
        
        # Find matches
        matched_skills = []
        for skill in expanded_jd_skills:
            if skill in expanded_resume_skills:
                matched_skills.append(skill)
        
        # Calculate score
        if len(expanded_jd_skills) == 0:
            score = 100
        else:
            score = int((len(matched_skills) / len(expanded_jd_skills)) * 100)
        
        return {
            'score': score,
            'skills_data': {
                'extracted': list(expanded_resume_skills),
                'missing_relevant': list(expanded_jd_skills - expanded_resume_skills)
            }
        }
    
    async def _compute_experience_score(
        self, 
        parsed_resume: ParsedResume, 
        parsed_jd: ParsedJD
    ) -> Dict[str, Any]:
        
        resume_years = parsed_resume.total_years_experience
        required_years = parsed_jd.required_years_experience
        
        # Calculate experience score
        if required_years == 0:
            score = 100
        elif resume_years >= required_years:
            score = 100
        else:
            score = max(0, int((resume_years / required_years) * 100))
        
        # Check role-specific experience
        experience_matches = []
        for exp in parsed_resume.experience:
            # Simple role matching
            if any(role in exp['title'].lower() for role in parsed_jd.role_keywords):
                experience_matches.append({
                    'req': f"{required_years}+ yrs experience",
                    'candidate': f"{exp['years']} yrs",
                    'ok': exp['years'] >= required_years
                })
        
        return {
            'score': score,
            'experience_data': {
                'total_years': resume_years,
                'matches': experience_matches
            }
        }
    
    async def _compute_education_score(
        self, 
        parsed_resume: ParsedResume, 
        parsed_jd: ParsedJD
    ) -> Dict[str, Any]:
        """Compute education matching score"""
        
        # For now, use a basic scoring based on degree level
        if not parsed_resume.education:
            return {'score': 50}
        
        # Check for relevant degrees
        relevant_degrees = ['computer science', 'engineering', 'mathematics', 'physics']
        resume_degrees = [edu['degree'].lower() for edu in parsed_resume.education]
        
        score = 50  # Base score
        
        for degree in resume_degrees:
            if any(relevant in degree for relevant in relevant_degrees):
                score += 25
                break
        
        # Bonus for advanced degrees
        for degree in resume_degrees:
            if 'master' in degree or 'phd' in degree or 'ph.d' in degree:
                score += 25
                break
        
        return {'score': min(100, score)}
    
    async def _compute_formatting_score(self, parsed_resume: ParsedResume) -> Dict[str, Any]:
        
        issues = []
        score = 100
        
        # Check for common ATS issues
        text = parsed_resume.raw_text.lower()
        
        # Check for images (if text is very short, might indicate image-only content)
        if len(text.strip()) < 100:
            issues.append("Resume appears to contain mostly images or non-parsable content")
            score -= 30
        
        # Check for unusual formatting
        if '\t' in text or '\r' in text:
            issues.append("Resume contains unusual formatting characters")
            score -= 10
        
        # Check for contact info in header/footer
        if 'email' in text[:200] and 'phone' in text[:200]:
            # This might be good, but check if it's properly formatted
            pass
        
        # Check for bullet points
        if '•' not in text and '-' not in text:
            issues.append("Resume lacks bullet points for better readability")
            score -= 15
        
        # Check for action verbs
        action_verbs = ['developed', 'implemented', 'created', 'built', 'managed', 'led', 'designed']
        action_verb_count = sum(1 for verb in action_verbs if verb in text)
        if action_verb_count < 3:
            issues.append("Resume could benefit from more action verbs")
            score -= 10
        
        # Check for summary section
        if not parsed_resume.summary:
            issues.append("Resume lacks a professional summary")
            score -= 10
        
        return {
            'score': max(0, score),
            'issues': issues
        }
    
    def _compute_overall_score(self, sub_scores: Dict[str, int]) -> int:
        overall_score = 0
        
        for category, score in sub_scores.items():
            weight = self.weights.get(category, 0)
            overall_score += score * weight
        
        return int(overall_score)
    
    def _extract_jd_keywords(self, parsed_jd: ParsedJD) -> List[Dict[str, str]]:
        keywords = []
        text = parsed_jd.raw_text.lower()
        
        # Extract skills and technologies
        for skill in parsed_jd.skills:
            importance = self._determine_keyword_importance(skill, text)
            keywords.append({
                'keyword': skill,
                'importance': importance
            })
        
        # Extract role keywords
        for role in parsed_jd.role_keywords:
            importance = self._determine_keyword_importance(role, text)
            keywords.append({
                'keyword': role,
                'importance': importance
            })
        
        return keywords
    
    def _determine_keyword_importance(self, keyword: str, text: str) -> str:
        text_lower = text.lower()
        
        # Look for importance indicators around the keyword
        context_start = max(0, text_lower.find(keyword.lower()) - 50)
        context_end = min(len(text_lower), text_lower.find(keyword.lower()) + len(keyword) + 50)
        context = text_lower[context_start:context_end]
        
        if any(word in context for word in ['required', 'must', 'essential', 'mandatory']):
            return 'required'
        elif any(word in context for word in ['preferred', 'desired', 'nice to have', 'bonus']):
            return 'preferred'
        else:
            return 'nice-to-have'
    
    def _keyword_exists_in_resume(self, keyword: str, parsed_resume: ParsedResume) -> bool:
        text = parsed_resume.raw_text.lower()
        keyword_lower = keyword.lower()
        
        # Exact match
        if keyword_lower in text:
            return True
        
        # Fuzzy match
        if fuzz.partial_ratio(keyword_lower, text) > 80:
            return True
        
        # Check synonyms
        if keyword_lower in self.skill_synonyms:
            for synonym in self.skill_synonyms[keyword_lower]:
                if synonym in text:
                    return True
        
        return False
    
    def _expand_skills_with_synonyms(self, skills: set) -> set:
        expanded = skills.copy()
        
        for skill in skills:
            if skill in self.skill_synonyms:
                expanded.update(self.skill_synonyms[skill])
        
        return expanded
    
    async def _generate_suggestions(
        self,
        parsed_resume: ParsedResume,
        parsed_jd: ParsedJD,
        keyword_score: Dict[str, Any],
        skills_score: Dict[str, Any],
        experience_score: Dict[str, Any],
        formatting_score: Dict[str, Any]
    ) -> Dict[str, List[str]]:
        
        suggestions = {
            'keyword_insertions': [],
            'resume_bullets_examples': [],
            'file_recommendation': ['Upload PDF without images or a clean DOCX']
        }
        
        # Keyword insertion suggestions
        for missing in keyword_score['missing_keywords']:
            keyword = missing['keyword']
            importance = missing['importance']
            
            if importance == 'required':
                suggestions['keyword_insertions'].append(
                    f"Add '{keyword}' to your resume - it's a required skill for this position"
                )
            elif importance == 'preferred':
                suggestions['keyword_insertions'].append(
                    f"Consider adding '{keyword}' to your resume - it's a preferred skill"
                )
        
        # Resume bullet examples
        if keyword_score['score'] < 70:
            suggestions['resume_bullets_examples'].append(
                "Instead of 'Built frontend', try 'Developed responsive React frontend with TypeScript'"
            )
            suggestions['resume_bullets_examples'].append(
                "Instead of 'Managed database', try 'Designed and optimized PostgreSQL database schema'"
            )
        
        # Formatting suggestions
        if formatting_score['score'] < 80:
            suggestions['resume_bullets_examples'].append(
                "Use bullet points (•) instead of dashes (-) for better ATS compatibility"
            )
            suggestions['resume_bullets_examples'].append(
                "Ensure contact information is at the top and easily readable"
            )
        
        return suggestions
    
    def _generate_explanations(
        self,
        keyword_score: Dict[str, Any],
        skills_score: Dict[str, Any],
        experience_score: Dict[str, Any],
        education_score: Dict[str, Any],
        formatting_score: Dict[str, Any]
    ) -> str:
        
        explanations = []
        
        # Overall score explanation
        overall = self._compute_overall_score({
            'keyword_match': keyword_score['score'],
            'skills': skills_score['score'],
            'experience': experience_score['score'],
            'education': education_score['score'],
            'formatting': formatting_score['score']
        })
        
        if overall >= 80:
            explanations.append("Excellent match! Your resume aligns very well with the job requirements.")
        elif overall >= 60:
            explanations.append("Good match with room for improvement. Focus on the areas below to increase your score.")
        else:
            explanations.append("Your resume needs significant improvements to match this job description.")
        
        # Specific explanations
        if keyword_score['score'] < 70:
            explanations.append(f"Keyword matching: {len(keyword_score['missing_keywords'])} important keywords are missing from your resume.")
        
        if skills_score['score'] < 70:
            explanations.append(f"Skills: {len(skills_score['skills_data']['missing_relevant'])} required skills are not found in your resume.")
        
        if experience_score['score'] < 70:
            explanations.append("Experience: Your years of experience don't fully meet the job requirements.")
        
        if formatting_score['score'] < 70:
            explanations.append("Formatting: Your resume has some ATS compatibility issues that could affect parsing.")
        
        return " ".join(explanations)
    
    def _compute_confidence(
        self,
        keyword_score: Dict[str, Any],
        skills_score: Dict[str, Any],
        experience_score: Dict[str, Any],
        education_score: Dict[str, Any],
        formatting_score: Dict[str, Any]
    ) -> float:
        
        # Base confidence
        confidence = 0.8
        
        # Adjust based on data quality
        if keyword_score['score'] == 0 or skills_score['score'] == 0:
            confidence -= 0.1
        
        if experience_score['score'] == 0:
            confidence -= 0.05
        
        # Adjust based on formatting issues
        if formatting_score['score'] < 50:
            confidence -= 0.1
        
        return max(0.5, min(1.0, confidence))
