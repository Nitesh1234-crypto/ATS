import asyncio
import io
import re
from typing import Dict, List, Any, Optional
from fastapi import UploadFile
import PyPDF2
import pdfplumber
from docx import Document
import spacy
from datetime import datetime
from dateutil import parser as date_parser
from app.schemas.scoring import ParsedResume, ParsedJD

class ParserService:
    
    def __init__(self):
        # Load spaCy model for NLP processing
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            # Fallback to basic processing if spaCy model not available
            self.nlp = None
            print("Warning: spaCy model not available, using basic text processing")
    
    async def parse_resume(self, file: UploadFile) -> ParsedResume:

        try:
            # Extract text from file
            text = await self._extract_text(file)
            
            # Parse the extracted text
            return self._parse_resume_text(text)
            
        except Exception as e:
            raise Exception(f"Error parsing resume: {str(e)}")
    
    async def parse_jd_file(self, file: UploadFile) -> ParsedJD:

        try:
            text = await self._extract_text(file)
            return self._parse_jd_text(text)
        except Exception as e:
            raise Exception(f"Error parsing JD file: {str(e)}")
    
    async def parse_jd_text(self, text: str) -> ParsedJD:
        try:
            return self._parse_jd_text(text)
        except Exception as e:
            raise Exception(f"Error parsing JD text: {str(e)}")
    
    async def _extract_text(self, file: UploadFile) -> str:
        content = await file.read()
        
        if file.filename.lower().endswith('.pdf'):
            return self._extract_pdf_text(content)
        elif file.filename.lower().endswith('.docx'):
            return self._extract_docx_text(content)
        elif file.filename.lower().endswith('.txt'):
            return content.decode('utf-8')
        else:
            raise ValueError(f"Unsupported file format: {file.filename}")
    
    def _extract_pdf_text(self, content: bytes) -> str:
        try:
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                text = ""
                for page in pdf.pages:
                    text += page.extract_text() or ""
                return text
        except Exception:
            try:
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text()
                return text
            except Exception as e:
                raise Exception(f"Failed to extract text from PDF: {str(e)}")
    
    def _extract_docx_text(self, content: bytes) -> str:
        try:
            doc = Document(io.BytesIO(content))
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        except Exception as e:
            raise Exception(f"Failed to extract text from DOCX: {str(e)}")
    
    def _parse_resume_text(self, text: str) -> ParsedResume:
        # Basic text cleaning
        text = self._clean_text(text)
        
        # Extract contact information
        contact_info = self._extract_contact_info(text)
        
        # Extract skills
        skills = self._extract_skills(text)
        
        # Extract experience
        experience = self._extract_experience(text)
        
        # Calculate total years of experience
        total_years = sum(exp.get('years', 0) for exp in experience)
        
        # Extract education
        education = self._extract_education(text)
        
        # Extract other sections
        certifications = self._extract_certifications(text)
        projects = self._extract_projects(text)
        summary = self._extract_summary(text)
        
        return ParsedResume(
            contact_info=contact_info,
            skills=skills,
            experience=experience,
            total_years_experience=total_years,
            education=education,
            certifications=certifications,
            projects=projects,
            summary=summary,
            raw_text=text
        )
    
    def _parse_jd_text(self, text: str) -> ParsedJD:
        text = self._clean_text(text)
        
        skills = self._extract_skills(text)
        required_years = self._extract_required_experience(text)
        role_keywords = self._extract_role_keywords(text)
        required_tech = self._extract_required_technologies(text)
        seniority = self._extract_seniority(text)
        responsibilities = self._extract_responsibilities(text)
        
        return ParsedJD(
            skills=skills,
            required_years_experience=required_years,
            role_keywords=role_keywords,
            required_technologies=required_tech,
            seniority=seniority,
            responsibilities=responsibilities,
            raw_text=text
        )
    
    def _clean_text(self, text: str) -> str:
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove special characters but keep basic punctuation
        text = re.sub(r'[^\w\s\.\,\-\+\&\@]', ' ', text)
        return text.strip()
    
    def _extract_contact_info(self, text: str) -> Dict[str, Optional[str]]:
        contact_info = {
            'name': None,
            'email': None,
            'phone': None,
            'location': None
        }
        
        # Extract email
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        email_match = re.search(email_pattern, text)
        if email_match:
            contact_info['email'] = email_match.group()
        
        # Extract phone
        phone_pattern = r'(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
        phone_match = re.search(phone_pattern, text)
        if phone_match:
            contact_info['phone'] = phone_match.group()
        
        # Basic name extraction (first line that looks like a name)
        lines = text.split('\n')
        for line in lines[:5]:  # Check first 5 lines
            line = line.strip()
            if len(line) > 2 and len(line) < 50 and not line.lower().startswith(('email', 'phone', 'address')):
                if not contact_info['name']:
                    contact_info['name'] = line
                break
        
        return contact_info
    
    def _extract_skills(self, text: str) -> List[str]:
        # Common technical skills
        skill_keywords = [
            'python', 'javascript', 'java', 'react', 'node.js', 'sql', 'aws',
            'docker', 'kubernetes', 'git', 'html', 'css', 'typescript',
            'angular', 'vue', 'mongodb', 'postgresql', 'mysql', 'redis',
            'elasticsearch', 'kafka', 'rabbitmq', 'jenkins', 'gitlab',
            'agile', 'scrum', 'kanban', 'jira', 'confluence'
        ]
        
        found_skills = []
        text_lower = text.lower()
        
        for skill in skill_keywords:
            if skill in text_lower:
                found_skills.append(skill.title())
        
        return found_skills
    
    def _extract_experience(self, text: str) -> List[Dict[str, Any]]:
        experience = []
        
        # Simple pattern matching for experience sections
        # This is a basic implementation - in production, you'd want more sophisticated parsing
        
        # Look for date patterns
        date_pattern = r'(\d{4})\s*[-–]\s*(\d{4}|\bpresent\b|\bcurrent\b)'
        date_matches = re.finditer(date_pattern, text, re.IGNORECASE)
        
        for match in date_matches:
            start_year = int(match.group(1))
            end_year = match.group(2)
            
            if end_year.lower() in ['present', 'current']:
                end_year = datetime.now().year
            else:
                end_year = int(end_year)
            
            years = end_year - start_year
            
            # Extract surrounding text as description
            start_pos = max(0, match.start() - 100)
            end_pos = min(len(text), match.end() + 100)
            description = text[start_pos:end_pos].strip()
            
            experience.append({
                'company': 'Company Name',  # Would need more sophisticated extraction
                'title': 'Job Title',       # Would need more sophisticated extraction
                'start_date': str(start_year),
                'end_date': str(end_year),
                'years': years,
                'description': description
            })
        
        return experience
    
    def _extract_education(self, text: str) -> List[Dict[str, Any]]:
        education = []
        
        # Look for degree patterns
        degree_patterns = [
            r'\b(bachelor|master|phd|b\.s\.|m\.s\.|ph\.d\.)\b',
            r'\b(computer science|engineering|mathematics|physics)\b'
        ]
        
        for pattern in degree_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                # Extract year
                year_pattern = r'\b(19|20)\d{2}\b'
                year_match = re.search(year_pattern, text[match.end():match.end()+50])
                year = int(year_match.group()) if year_match else 0
                
                education.append({
                    'degree': match.group().title(),
                    'institution': 'Institution Name',  # Would need more sophisticated extraction
                    'year': year
                })
        
        return education
    
    def _extract_certifications(self, text: str) -> List[str]:
        cert_patterns = [
            r'\b(aws|azure|gcp|cisco|microsoft|oracle|ibm)\s+(certified|professional|associate|expert)\b',
            r'\b(pmp|scrum|agile|six\s+sigma|lean)\b'
        ]
        
        certifications = []
        for pattern in cert_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                certifications.append(match.group().title())
        
        return certifications
    
    def _extract_projects(self, text: str) -> List[str]:
        # Look for project-related keywords
        project_keywords = ['project', 'developed', 'built', 'created', 'implemented']
        projects = []
        
        sentences = text.split('.')
        for sentence in sentences:
            if any(keyword in sentence.lower() for keyword in project_keywords):
                if len(sentence.strip()) > 20:  # Only include substantial descriptions
                    projects.append(sentence.strip())
        
        return projects[:5]  # Limit to 5 projects
    
    def _extract_summary(self, text: str) -> str:
        # Look for summary section
        summary_patterns = [
            r'\b(summary|objective|profile|about)\b.*?\.',
            r'^[^.]{50,200}\.'
        ]
        
        for pattern in summary_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                return match.group().strip()
        
        # Fallback: first paragraph
        paragraphs = text.split('\n\n')
        for para in paragraphs:
            if len(para.strip()) > 50:
                return para.strip()
        
        return ""
    
    def _extract_required_experience(self, text: str) -> float:
        patterns = [
            r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?experience',
            r'experience:\s*(\d+)\+?\s*(?:years?|yrs?)',
            r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:in\s+)?(?:the\s+)?field'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return float(match.group(1))
        
        return 0.0
    
    def _extract_role_keywords(self, text: str) -> List[str]:
        role_keywords = [
            'engineer', 'developer', 'architect', 'manager', 'lead', 'senior',
            'junior', 'principal', 'staff', 'director', 'vp', 'cto'
        ]
        
        found_keywords = []
        text_lower = text.lower()
        
        for keyword in role_keywords:
            if keyword in text_lower:
                found_keywords.append(keyword.title())
        
        return found_keywords
    
    def _extract_required_technologies(self, text: str) -> List[str]:
        return self._extract_skills(text)  # Reuse skills extraction
    
    def _extract_seniority(self, text: str) -> str:
        seniority_patterns = [
            (r'\b(junior|entry\s+level|junior\s+level)\b', 'junior'),
            (r'\b(mid\s+level|intermediate)\b', 'mid-level'),
            (r'\b(senior|senior\s+level)\b', 'senior'),
            (r'\b(lead|principal|staff)\b', 'lead'),
            (r'\b(architect|director|vp|cto)\b', 'executive')
        ]
        
        text_lower = text.lower()
        for pattern, level in seniority_patterns:
            if re.search(pattern, text_lower):
                return level
        
        return 'mid-level'  # Default
    
    def _extract_responsibilities(self, text: str) -> List[str]:
        responsibilities = []
        
        # Look for responsibility patterns
        resp_patterns = [
            r'\b(responsible\s+for|duties|responsibilities?|key\s+responsibilities?)\b.*?\.',
            r'•\s*(.*?)(?=\n|$)',
            r'-\s*(.*?)(?=\n|$)'
        ]
        
        for pattern in resp_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE | re.DOTALL)
            for match in matches:
                if pattern in resp_patterns[1:]:  # Bullet points
                    responsibilities.append(match.group(1).strip())
                else:  # Text blocks
                    responsibilities.append(match.group().strip())
        
        return responsibilities[:10]  # Limit to 10 responsibilities
