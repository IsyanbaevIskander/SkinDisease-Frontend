import api from "./axios";

export async function getPatientRequests() {
    return api.get("diagnosis_requests/");
}

export async function createRequest(file) {
    const formData = new FormData();
    formData.append("image", file);

    return api.post("diagnosis_requests/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
}

export async function getDoctorResults() {
    return api.get("medical_verifications/?status=pending"); // можно фильтровать
}

export async function verifyResult(resultId, conditionId) {
    return api.post("medical_verifications/", {
        result: resultId,
        doctor_id: store.userId,
        actual_condition: conditionId
    });
}

export async function getProfile() {
    return api.get("users/me/"); // если есть View для текущего
}

export async function updateProfile(data) {
    return api.patch("users/me/", data);
}
