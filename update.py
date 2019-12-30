from selenium import webdriver
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup
import json

def retrieveString(array):
    out = []
    for i in array:
        if isinstance(i, str):
            out.append(i.strip())
    return out

baseURL = "http://www.vaniercollege.qc.ca/online-schedule/"

driver = webdriver.Firefox()
driver.get(baseURL)

assert "Vanier" in driver.title

tbodies = driver.find_elements(By.XPATH, "//td[@valign='TOP']")

b = BeautifulSoup(driver.page_source, "html.parser")

links = []

allcourses = {}

for i in b.find_all("a"):
    l = i.get("href")
    if "vaniercollege.qc.ca" not in l:
        links.append(l.strip())

for i in links:
    driver.get(baseURL + i)
    b = BeautifulSoup(driver.page_source, "html.parser")

    if "Access Denied - Sucuri Website Firewall" in driver.page_source:
        continue

    table = b.find_all("table")[1]

    allClasses = table.find_all("tr")
    allClasses.pop(0)

    for c in allClasses:
        element = c.find_all("td")

        section = element[0].font.contents[0]
        courseID = element[1].font.contents[0].strip().replace("&nbsp;", "")
        
        linkinfo = element[2].find("a")
        description = ""
        courseName = ""
        if linkinfo != None:
            description = baseURL + linkinfo.get("href").strip().replace(" ", "")
            courseName = linkinfo.contents[0]
        else:
            courseName = element[2].font.contents[0].strip().replace("&nbsp;", "")

        teacher = element[6].font.contents[0].strip()
        days = retrieveString(element[7].font.contents)
        times = retrieveString(element[8].font.contents)

        tmp = []
        for t in times:
            tmp.append(t.replace(" ", ""))
        times = tmp

        if courseID not in allcourses.keys():
            allcourses[courseID] = {}

        allcourses[courseID][section] = {}

        allcourses[courseID][section]["Title"] = courseName
        allcourses[courseID][section]["Teacher"] = teacher
        allcourses[courseID][section]["Course Info"] = description
        allcourses[courseID][section]["More Info"] = ""
        allcourses[courseID][section]["Day"] = days
        allcourses[courseID][section]["Time"] = times

driver.close()

with open('test.json', 'w') as fp:
    fp.write(json.dumps(allcourses, indent=4))