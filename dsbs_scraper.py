import requests
from bs4 import BeautifulSoup
import re
import time

class DSBSDataScraper:
    SEARCH_URL = "https://dsbs.sba.gov/search/dsp_dsbs.cfm"
    RESULTS_URL = "https://dsbs.sba.gov/search/dsp_searchresults.cfm"
    
    def __init__(self):
        self.session = requests.Session()
        # Add headers to mimic a browser
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
    
    def _extract_emails(self, text):
        """Extract email addresses from text using regex"""
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        return list(set(re.findall(email_pattern, text)))
    
    def _extract_phones(self, text):
        """Extract phone numbers from text using regex"""
        phone_pattern = r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
        return list(set(re.findall(phone_pattern, text)))
    
    def _clean_text(self, text):
        """Clean and normalize text"""
        if not text:
            return ""
        return ' '.join(text.split()).strip()
    
    def get_contact_info(self, uei=None, cage_code=None, state=None):
        """
        Scrape contact information from DSBS using UEI, CAGE code, and state
        All three parameters are required by DSBS
        """
        try:
            if not all([uei, cage_code, state]):
                return {
                    "success": False,
                    "error": "UEI, CAGE code, and state are all required"
                }

            # Prepare search parameters
            search_params = {
                'uei_number': uei,
                'cage_code': cage_code,
                'state': state
            }
            
            # Add a small delay to be respectful to the server
            time.sleep(1)
            
            # Submit the search form
            response = self.session.post(self.SEARCH_URL, data=search_params)
            response.raise_for_status()
            
            # Add logging
            print("DSBS Response Status:", response.status_code)
            print("DSBS Response URL:", response.url)
            print("DSBS Response Text:", response.text[:500])  # First 500 chars
            
            # Parse the results page
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Initialize contact info structure
            contact_info = {
                "additional_contacts": [],
                "email_addresses": [],
                "phone_numbers": [],
                "social_media": [],
                "success": True
            }
            
            # Extract all text content
            page_text = soup.get_text()
            
            # Extract contact information
            contact_info["email_addresses"] = self._extract_emails(page_text)
            contact_info["phone_numbers"] = self._extract_phones(page_text)
            
            # Look for contact sections
            contact_sections = soup.find_all(['td', 'div'], text=re.compile(
                r'Contact Person|Representative|POC|Point of Contact', 
                re.I
            ))
            
            for section in contact_sections:
                contact_text = self._clean_text(section.get_text())
                if contact_text and not any(
                    contact_text in existing 
                    for existing in contact_info["additional_contacts"]
                ):
                    contact_info["additional_contacts"].append(contact_text)
            
            # If no contact information was found
            if not any([
                contact_info["email_addresses"],
                contact_info["phone_numbers"],
                contact_info["additional_contacts"]
            ]):
                return {
                    "success": False,
                    "error": "No contact information found"
                }
            
            return contact_info
            
        except requests.RequestException as e:
            return {
                "success": False,
                "error": f"Request failed: {str(e)}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            } 