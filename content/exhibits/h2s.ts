// Exhibit data for Hard2Soft, taken from the Shopify theme in ..\h2s.

/**
 * The symptom check as implemented in snippets/city-landing.liquid (the "live ring scanner").
 * The labels are the Delhi NCR page's list, which most city pages share word for word; a few
 * pages reword them locally. The scanner is a plain count: every symptom weighs 1, and the ring
 * fills by (ticked / total).
 */
export const H2S_SYMPTOMS: { id: string; label: string; weight: number }[] = [
  { id: "tap-scale", label: "White chalky deposits on taps and showerheads reappear within days of cleaning", weight: 1 },
  { id: "geyser", label: "Geyser heating element fails or loses efficiency every 2-3 years", weight: 1 },
  { id: "hair-fall", label: "Hair falls more than usual after every shower", weight: 1 },
  { id: "dry-skin", label: "Skin feels dry and tight after bathing despite using moisturiser", weight: 1 },
  { id: "no-lather", label: "Soap and shampoo refuse to lather - you use 30-50% more than you should", weight: 1 },
  { id: "stiff-laundry", label: "Washing machine clothes feel stiff even after a full wash cycle", weight: 1 },
  { id: "ro-membrane", label: "RO filter membrane needs replacing more often than every 18 months", weight: 1 },
  { id: "tile-film", label: "Bathroom tiles have a permanent white or yellow film that will not clean off", weight: 1 },
  { id: "repair-visits", label: "Plumber or appliance technician visits are becoming more frequent", weight: 1 },
  { id: "metallic-smell", label: "Water smells faintly metallic or earthy", weight: 1 },
];

/**
 * The gauge bands, by number of symptoms ticked. 0 is an idle state ("Tap to begin") with a grey
 * ring and the Order button dimmed; the button wakes from 3 ticks ("high") upwards.
 * Ring colours on the site: low #1257C7 · high #D98A1F · severe #B3431F.
 * Verdicts on the site: low "Even a couple of these means hard water is already working on your home."
 * · high "That's your water, not your products." · severe "Your home is taking heavy hard-water damage."
 * (the live high/severe lines continue with a price per day, which changes with each price round).
 */
export const H2S_LEVELS: { upTo: number; label: string; tone: "low" | "high" | "severe" }[] = [
  { upTo: 2, label: "Early signs", tone: "low" },
  { upTo: 5, label: "Strong match", tone: "high" },
  { upTo: 10, label: "Severe - act now", tone: "severe" },
];

/**
 * The 43 city and state landing pages (templates/page.hard-water-*.liquid; all 43 are in the live
 * sitemap). `hardness` is the page's own stated borewell range (its gauge_range parameter).
 * lat/lng are public coordinates of the city centre; for the nine state pages (name === state)
 * they are an approximate point inside the state, near its middle.
 * Gachibowli, Kondapur and Miyapur are Hyderabad localities with their own pages.
 */
export const H2S_CITIES: { name: string; state: string; lat: number; lng: number; hardness?: string }[] = [
  { name: "Ahmedabad", state: "Gujarat", lat: 23.02, lng: 72.57, hardness: "400-600 ppm" },
  { name: "Ajmer", state: "Rajasthan", lat: 26.45, lng: 74.64, hardness: "400-600 ppm" },
  { name: "Aurangabad", state: "Maharashtra", lat: 19.88, lng: 75.34, hardness: "320-440 ppm" },
  { name: "Bangalore", state: "Karnataka", lat: 12.97, lng: 77.59, hardness: "160-560 ppm" },
  { name: "Chennai", state: "Tamil Nadu", lat: 13.08, lng: 80.27, hardness: "280-480 ppm" },
  { name: "Coimbatore", state: "Tamil Nadu", lat: 11.02, lng: 76.96, hardness: "340-460 ppm" },
  { name: "Delhi NCR", state: "Delhi", lat: 28.61, lng: 77.21, hardness: "320-700 ppm" },
  { name: "Faridabad", state: "Haryana", lat: 28.41, lng: 77.32, hardness: "400-600 ppm" },
  { name: "Gachibowli", state: "Telangana", lat: 17.44, lng: 78.35, hardness: "400-470 ppm" },
  { name: "Ghaziabad", state: "Uttar Pradesh", lat: 28.67, lng: 77.45, hardness: "320-520 ppm" },
  { name: "Greater Noida", state: "Uttar Pradesh", lat: 28.47, lng: 77.5, hardness: "380-540 ppm" },
  { name: "Gujarat", state: "Gujarat", lat: 22.7, lng: 71.6, hardness: "350-600 ppm" },
  { name: "Gurgaon", state: "Haryana", lat: 28.46, lng: 77.03, hardness: "450-700 ppm" },
  { name: "Haryana", state: "Haryana", lat: 29.06, lng: 76.09, hardness: "250-700 ppm" },
  { name: "Hosur", state: "Tamil Nadu", lat: 12.74, lng: 77.83, hardness: "380-470 ppm" },
  { name: "Hubballi-Dharwad", state: "Karnataka", lat: 15.36, lng: 75.12, hardness: "300-420 ppm" },
  { name: "Hyderabad", state: "Telangana", lat: 17.39, lng: 78.49, hardness: "260-480 ppm" },
  { name: "Jaipur", state: "Rajasthan", lat: 26.91, lng: 75.79, hardness: "400-700 ppm" },
  { name: "Jodhpur", state: "Rajasthan", lat: 26.24, lng: 73.02, hardness: "450-750 ppm" },
  { name: "Kanpur", state: "Uttar Pradesh", lat: 26.45, lng: 80.33, hardness: "300-520 ppm" },
  { name: "Karnataka", state: "Karnataka", lat: 14.6, lng: 75.9, hardness: "160-560 ppm" },
  { name: "Kondapur", state: "Telangana", lat: 17.46, lng: 78.36, hardness: "390-460 ppm" },
  { name: "Lucknow", state: "Uttar Pradesh", lat: 26.85, lng: 80.95, hardness: "300-500 ppm" },
  { name: "Madurai", state: "Tamil Nadu", lat: 9.93, lng: 78.12, hardness: "280-400 ppm" },
  { name: "Maharashtra", state: "Maharashtra", lat: 19.45, lng: 76.4, hardness: "220-480 ppm" },
  { name: "Miyapur", state: "Telangana", lat: 17.5, lng: 78.36, hardness: "370-440 ppm" },
  { name: "Mysuru", state: "Karnataka", lat: 12.3, lng: 76.64, hardness: "250-400 ppm" },
  { name: "Nashik", state: "Maharashtra", lat: 20.0, lng: 73.79, hardness: "280-400 ppm" },
  { name: "Noida", state: "Uttar Pradesh", lat: 28.54, lng: 77.39, hardness: "350-550 ppm" },
  { name: "Pimpri-Chinchwad", state: "Maharashtra", lat: 18.63, lng: 73.8, hardness: "380-460 ppm" },
  { name: "Pune", state: "Maharashtra", lat: 18.52, lng: 73.86, hardness: "360-480 ppm" },
  { name: "Punjab", state: "Punjab", lat: 30.9, lng: 75.4, hardness: "250-550 ppm" },
  { name: "Rajasthan", state: "Rajasthan", lat: 27.3, lng: 73.6, hardness: "350-750 ppm" },
  { name: "Rajkot", state: "Gujarat", lat: 22.3, lng: 70.8, hardness: "400-580 ppm" },
  { name: "Secunderabad", state: "Telangana", lat: 17.44, lng: 78.5, hardness: "250-380 ppm" },
  { name: "Surat", state: "Gujarat", lat: 21.17, lng: 72.83, hardness: "350-520 ppm" },
  { name: "Tamil Nadu", state: "Tamil Nadu", lat: 11.13, lng: 78.66, hardness: "190-480 ppm" },
  { name: "Telangana", state: "Telangana", lat: 18.11, lng: 79.02, hardness: "260-480 ppm" },
  { name: "Tiruppur", state: "Tamil Nadu", lat: 11.11, lng: 77.34, hardness: "350-440 ppm" },
  { name: "Tumakuru", state: "Karnataka", lat: 13.34, lng: 77.1, hardness: "320-420 ppm" },
  { name: "Udaipur", state: "Rajasthan", lat: 24.59, lng: 73.71, hardness: "350-550 ppm" },
  { name: "Uttar Pradesh", state: "Uttar Pradesh", lat: 27.1, lng: 79.9, hardness: "280-540 ppm" },
  { name: "Vadodara", state: "Gujarat", lat: 22.31, lng: 73.18, hardness: "350-500 ppm" },
];
