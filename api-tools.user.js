// ==UserScript==
// @name         4. Canvas Rubric Tools
// @description  Import rubric scores (with conditional update confirmations), export rubric scores to CSV, and save individual rubric rows in Canvas Speedgrader.
// @match        https://*/courses/*/gradebook/speed_grader?*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.1.0/papaparse.min.js
// @run-at       document-idle
// @version      1.3.0
// ==/UserScript==

/* globals $, Papa */
ap
// ==========================
// Utility Functions
// ==========================
function defer(method) {
    if (typeof $ !== 'undefined') {
        method();
    } else {
        setTimeout(function() { defer(method); }, 100);
    }
}

function waitForElement(selector, callback) {
    if ($(selector).length) {
        callback();
    } else {
        setTimeout(function() { waitForElement(selector, callback); }, 100);
    }
}

var saveText = (function () {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    return function (textArray, fileName) {
        var blob = new Blob(textArray, {type: "text"});
        var url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    };
}());

function csvEncode(string) {
    if (string && (string.includes('"') || string.includes(','))) {
        return '"' + string.replace(/"/g, '""') + '"';
    }
    return string;
}

function popUp(id, text, callback) {
    $(id).html(`<p>${text}</p>`);
    $(id).dialog({
        buttons: {
            Ok: function() {
                $(this).dialog("close");
                if (callback) {
                  callback();
                }
            }
        }
    }).dialog("open");
}

function popClose(id) {
    $(id).dialog("close");
}

// ==========================
// Import Rubric Scores (with Conditional Confirmation)
// ==========================
function getAssignId() {
    const urlParams = window.location.href.split('?')[1].split('&');
    for (const param of urlParams) {
        if (param.split('=')[0] === "assignment_id") {
            return param.split('=')[1];
        }
    }
}

function getAllPages(url, callback) {
    getRemainingPages(url, [], callback);
}
function getRemainingPages(nextUrl, listSoFar, callback) {
    $.getJSON(nextUrl, function(responseList, textStatus, jqXHR) {
        var nextLink = null;
        $.each(jqXHR.getResponseHeader("link").split(','), function (linkIndex, linkEntry) {
            if (linkEntry.split(';')[1].includes('rel="next"')) {
                nextLink = linkEntry.split(';')[0].slice(1, -1);
            }
        });
        if (nextLink == null) {
            callback(listSoFar.concat(responseList));
        } else {
            getRemainingPages(nextLink, listSoFar.concat(responseList), callback);
        }
    });
}

function showProgress(amount) {
    $("#import_rubric_bar").progressbar({ value: amount });
    if (amount === 100) {
        $("#import_rubric_progress").dialog("close");
    } else {
        $("#import_rubric_progress").dialog("open");
    }
}

function sendRequests(requests, successCallback, errorCallback) {
    var errors = [];
    var completed = 0;
    var chunkSize = 10;
    function sendChunk(i) {
        $.each(requests.slice(i, i + chunkSize), function(_, request) {
            $.ajax(request.request)
            .fail(function(jqXHR, textStatus, errorThrown) {
                errors.push(`${request.error}${jqXHR.status} - ${errorThrown}\n`);
            })
            .always(requestSent);
        });
        showProgress(i * 100 / requests.length);
        if (i + chunkSize < requests.length) {
            setTimeout(sendChunk, 1000, i + chunkSize);
        }
    }
    function requestSent() {
        completed++;
        if (completed >= requests.length) {
            showProgress(100);
            if (errors.length > 0) {
                errorCallback(errors);
            } else {
                successCallback();
            }
        }
    }
    sendChunk(0);
}

function openImportDialog(fileCallback, importCallback) {
    $("#import_rubric_dialog").html(`
<p>Import a spreadsheet of rubric scores/ratings as grades for this assignment.</p>
<hr>
<label for="import_rubric_file">Rubric scores file: </label>
<input type="file" id="import_rubric_file"/><br>
<span id="import_rubric_results"></span><br>
<button type="button" class="Button" id="import_rubric_import_btn" disabled>Import</button>
<hr>
<div id="import_feedback_log" style="max-height:150px; overflow:auto; border:1px solid #ccc; padding:5px;"></div>`);

    $('#import_rubric_file').change(function(evt) {
        fileCallback(evt.target.files[0], function(scoreData) {
            $('#import_rubric_import_btn').removeAttr("disabled");
            $('#import_rubric_import_btn').click(function() {
                $("#import_rubric_dialog").dialog("close");
                importCallback(scoreData);
            });
        });
    });
    $("#import_rubric_dialog").dialog({width: 400});
}

function validateData(csvData, successCallback) {
    let inData = csvData.filter(i => i["Student ID"] !== undefined);
    let outData = inData.filter(i => i["Student ID"] !== "null");
    let allPtsCriteria = Object.keys(outData[0]).filter(i => i.startsWith("Points: ")).map(i => i.slice(8));
    let allRtgCriteria = Object.keys(outData[0]).filter(i => i.startsWith("Rating: ")).map(i => i.slice(8));

    if (!inData.length) {
        $("#import_rubric_results").text("No data in CSV. Please choose a different file.");
    } else if (!outData.length) {
        $("#import_rubric_results").text("No users found with valid Student IDs. Please choose a different file.");
    } else if (!('Student Name' in outData[0])) {
        $("#import_rubric_results").text("No 'Student Name' column found. Check file format.");
    } else if (!('Student ID' in outData[0])) {
        $("#import_rubric_results").text("No 'Student ID' column found. Check file format.");
    } else if (!allPtsCriteria.length && !allRtgCriteria.length) {
        $("#import_rubric_results").text("No proper rubric columns found. Check file format.");
    } else {
        const courseId = window.location.href.split('/')[4];
        const assignId = getAssignId();
        $.getJSON(`/api/v1/courses/${courseId}/assignments/${assignId}`, function(assignment) {
            let criteriaIds = {};
            let unmatchedCriteria = [];
            let doubledCriteria = [];
            $.each(allPtsCriteria, function(i, criterion) {
                const found = assignment.rubric.find(item => item.description === criterion);
                if (found) {
                    criteriaIds[criterion] = found.id;
                } else {
                    unmatchedCriteria.push(criterion);
                }
            });
            $.each(allRtgCriteria, function(i, criterion) {
                const found = assignment.rubric.find(item => item.description === criterion);
                if (found) {
                    if (criterion in criteriaIds) {
                        doubledCriteria.push(criterion);
                    } else {
                        criteriaIds[criterion] = found.id;
                    }
                } else {
                    unmatchedCriteria.push(criterion);
                }
            });
            if (!Object.keys(criteriaIds).length) {
                $("#import_rubric_results").text("No matching rubric criteria found for this assignment.");
            } else {
                function getRatingObj(criterionId, ratingDesc) {
                    const criterion = assignment.rubric.find(item => item.id === criterionId);
                    return criterion ? criterion.ratings.find(item => item.description === ratingDesc) : undefined;
                }
                function getScores(row) {
                    let scores = { user: row["Student ID"] };
                    $.each(criteriaIds, function(criterion, critId) {
                        if (`Points: ${criterion}` in row) {
                            scores[critId] = { points: row[`Points: ${criterion}`] };
                        } else {
                            const rating = getRatingObj(critId, row[`Rating: ${criterion}`]);
                            scores[critId] = rating ? { points: rating.points, rating: rating.id } : { error: String(row[`Rating: ${criterion}`]) };
                        }
                    });
                    return scores;
                }
                const scoreData = outData.map(i => getScores(i));
                const badRows = scoreData.filter(i => {
                    return Object.keys(i).some(key => key !== "user" && i[key].error && i[key].error !== "");
                });
                if (badRows.length) {
                    let errors = [];
                    $.each(badRows.slice(0, 5), function(i, scoreObj) {
                        let errKey = Object.keys(scoreObj).find(k => k !== "user" && scoreObj[k].error);
                        errors.push(`ERROR: Rating "${scoreObj[errKey].error}" for student ${scoreObj.user} does not match a rubric rating.`);
                    });
                    let errTxt = errors.join("<br>");
                    if (badRows.length > errors.length) {
                        errTxt += `<br>... (${badRows.length - errors.length} more errors)`;
                    }
                    $("#import_rubric_results").html(errTxt);
                } else {
                    let notice = `<p>Ready to import scores for ${Object.keys(criteriaIds).length} criteria and ${outData.length} user(s).</p>`;
                    if (unmatchedCriteria.length) {
                        notice += `<p>WARNING: ${unmatchedCriteria.length} criteria not found and will be ignored:<br>${unmatchedCriteria.join("<br>")}</p>`;
                    }
                    if (doubledCriteria.length) {
                        notice += `<p>WARNING: ${doubledCriteria.length} criteria have both rating and points specified; ratings will be ignored:<br>${doubledCriteria.join("<br>")}</p>`;
                    }
                    if ("Posted Score" in outData[0]) {
                        notice += `<p>Note: "Posted Score" column will be ignored.</p>`;
                    }
                    if (outData.length < inData.length) {
                        notice += `<p>Note: ${inData.length - outData.length} user(s) with null Student IDs ignored.</p>`;
                    }
                    $("#import_rubric_results").html(notice);
                    successCallback(scoreData);
                }
            }
        });
    }
}

// Before updating a criterion, only prompt if the new score differs from the existing value.
function checkAndConfirmUpdates(userScore, submission, callback) {
    const critKeys = Object.keys(userScore).filter(key => key !== "user");
    function processCriterion(i) {
        if (i >= critKeys.length) {
            callback(userScore);
            return;
        }
        const critId = critKeys[i];
        const newPoints = userScore[critId].points;
        const existingAssessment = submission.rubric_assessment && submission.rubric_assessment[critId];
        if (existingAssessment &&
            existingAssessment.points !== null &&
            existingAssessment.points !== undefined &&
            existingAssessment.points !== "") {
            if (existingAssessment.points == newPoints) {
                $("#import_feedback_log").append(`<div>Student ${userScore.user}: Criterion ${critId} already has score (${existingAssessment.points}); no update needed.</div>`);
                processCriterion(i + 1);
                return;
            }
            $("#confirm_update_dialog").html(`<p>Student ${userScore.user}: Criterion <strong>${critId}</strong> currently has a score of ${existingAssessment.points}, but the new value is ${newPoints}.<br>Update this score?</p>`);
            $("#confirm_update_dialog").dialog({
                modal: true,
                title: "Confirm Update",
                buttons: {
                    "Update": function() {
                        $(this).dialog("close");
                        $("#import_feedback_log").append(`<div>Student ${userScore.user}: Updating criterion ${critId} from ${existingAssessment.points} to ${newPoints}.</div>`);
                        processCriterion(i + 1);
                    },
                    "Skip": function() {
                        $(this).dialog("close");
                        $("#import_feedback_log").append(`<div>Student ${userScore.user}: Skipping update for criterion ${critId}.</div>`);
                        delete userScore[critId];
                        processCriterion(i + 1);
                    }
                },
                close: function() {
                    $("#import_feedback_log").append(`<div>Student ${userScore.user}: Aborted update for criterion ${critId}.</div>`);
                    delete userScore[critId];
                    processCriterion(i + 1);
                }
            });
        } else {
            processCriterion(i + 1);
        }
    }
    processCriterion(0);
}

function importScores(scores) {
    $("#import_rubric_file").val('');
    const courseId = window.location.href.split('/')[4];
    const assignId = getAssignId();
    var requests = [];
    const total = scores.length;

    $("#import_feedback_log").append(`<div>Starting import for ${total} student(s).</div>`);

    function pushRequest(request) {
        requests.push(request);
        if (requests.length === total) {
            sendRequests(
                requests,
                function() { popUp("#import_rubric_popup_dialog", "All scores/ratings imported successfully!", function() { location.reload(); }); },
                function(errors) {
                    saveText(errors, "errors.txt");
                    popUp("#import_rubric_popup_dialog", `Import complete. WARNING: ${errors.length} rows failed. See errors.txt for details.`, function() { location.reload(); });
                }
            );
        }
    }

    const chunkSize = 10;
    function buildRequests(chunkIndex) {
        $.each(scores.slice(chunkIndex, chunkIndex + chunkSize), function(_, userScore) {
            const endpoint = `/api/v1/courses/${courseId}/assignments/${assignId}/submissions/sis_user_id:${userScore.user}`;
            $.getJSON(`${endpoint}?include[]=rubric_assessment`, function(submission) {
                checkAndConfirmUpdates(userScore, submission, function(finalUserScore) {
                    var params = {};
                    if (submission.rubric_assessment) {
                        $.each(submission.rubric_assessment, function(rowKey, rowValue) {
                            $.each(rowValue, function(cellKey, cellValue) {
                                params[`rubric_assessment[${rowKey}][${cellKey}]`] = cellValue;
                            });
                            if (!(`rubric_assessment[${rowKey}][comments]` in params) || params[`rubric_assessment[${rowKey}][comments]`] === undefined) {
                                params[`rubric_assessment[${rowKey}][comments]`] = "";
                            }
                        });
                    }
                    $.each(finalUserScore, function(critId, critScore) {
                        if (critId !== "user") {
                            if ("error" in critScore) {
                                params[`rubric_assessment[${critId}][points]`] = undefined;
                                params[`rubric_assessment[${critId}][rating_id]`] = undefined;
                            } else {
                                params[`rubric_assessment[${critId}][points]`] = critScore.points;
                                if ("rating" in critScore) {
                                    params[`rubric_assessment[${critId}][rating_id]`] = critScore.rating;
                                } else {
                                    delete params[`rubric_assessment[${critId}][rating_id]`];
                                }
                            }
                            if (!(`rubric_assessment[${critId}][comments]` in params)) {
                                params[`rubric_assessment[${critId}][comments]`] = "";
                            }
                        }
                    });
                    $("#import_feedback_log").append(`<div>Student ${finalUserScore.user}: Prepared update request.</div>`);
                    pushRequest({
                        request: { url: endpoint, type: "PUT", data: params, dataType: "text" },
                        error: `Failed to import scores for student ${finalUserScore.user} using endpoint ${endpoint}. Response: `
                    });
                });
            });
        });
        if (chunkIndex + chunkSize < scores.length) {
            setTimeout(buildRequests, 1000, chunkIndex + chunkSize);
        }
    }
    buildRequests(0);
}

// ==========================
// Export Rubric Scores to CSV
// ==========================
function exportRubricScores() {
    popUp("#export_rubric_dialog", "Exporting scores, please wait...");
    const courseId = window.location.href.split('/')[4];
    const urlParams = window.location.href.split('?')[1].split('&');
    const assignId = urlParams.find(i => i.split('=')[0] === "assignment_id").split('=')[1];

    $.getJSON(`/api/v1/courses/${courseId}/assignments/${assignId}`, function(assignment) {
        getAllPages(`/api/v1/courses/${courseId}/enrollments?per_page=100`, function(enrollments) {
            getAllPages(`/api/v1/courses/${courseId}/assignments/${assignId}/submissions?include[]=rubric_assessment&per_page=100`, function(submissions) {
                if (!('rubric_settings' in assignment)) {
                    popUp("#export_rubric_dialog", `ERROR: No rubric settings found at /api/v1/courses/${courseId}/assignments/${assignId}.<br/><br/>This is likely due to a Canvas bug; please use the undelete feature or contact Canvas Support.`);
                    return;
                }
                const hidePoints = assignment.rubric_settings.hide_points;
                const hideRatings = assignment.rubric_settings.free_form_criterion_comments;
                if (hidePoints && hideRatings) {
                    popUp("#export_rubric_dialog", "ERROR: This rubric is configured to use free-form comments and hide points, so there is nothing to export!");
                    return;
                }
                var critOrder = {};
                var critRatingDescs = {};
                var header = "Student Name,Student ID,Posted Score,Attempt Number";
                $.each(assignment.rubric, function(critIndex, criterion) {
                    critOrder[criterion.id] = critIndex;
                    if (!hideRatings) {
                        critRatingDescs[criterion.id] = {};
                        $.each(criterion.ratings, function(i, rating) {
                            critRatingDescs[criterion.id][rating.id] = rating.description;
                        });
                        header += ',' + csvEncode('Rating: ' + criterion.description);
                    }
                    if (!hidePoints) {
                        header += ',' + csvEncode('Points: ' + criterion.description);
                    }
                });
                header += '\n';
                var csvRows = [header];
                $.each(submissions, function(subIndex, submission) {
                    const {user} = enrollments.find(i => i.user_id === submission.user_id);
                    if (user) {
                        var row = `${user.name},${user.sis_user_id},${submission.score},${submission.attempt}`;
                        var crits = [];
                        var critIds = [];
                        if (submission.rubric_assessment != null) {
                            $.each(submission.rubric_assessment, function(critKey, critValue) {
                                if (hideRatings) {
                                    crits.push({id: critKey, points: critValue.points, rating: null});
                                } else {
                                    crits.push({id: critKey, points: critValue.points, rating: critRatingDescs[critKey][critValue.rating_id]});
                                }
                                critIds.push(critKey);
                            });
                        }
                        $.each(critOrder, function(critKey, critValue) {
                            if (!critIds.includes(critKey)) {
                                crits.push({id: critKey, points: null, rating: null});
                            }
                        });
                        crits.sort(function(a, b) { return critOrder[a.id] - critOrder[b.id]; });
                        $.each(crits, function(critIndex, criterion) {
                            if (!hideRatings) {
                                row += `,${csvEncode(criterion.rating)}`;
                            }
                            if (!hidePoints) {
                                row += `,${criterion.points}`;
                            }
                        });
                        row += '\n';
                        csvRows.push(row);
                    }
                });
                popClose("#export_rubric_dialog");
                saveText(csvRows, `Rubric Scores ${assignment.name.replace(/[^a-zA-Z 0-9]+/g, '')}.csv`);
            });
        });
    }).fail(function (jqXHR, textStatus, errorThrown) {
        popUp("#export_rubric_dialog", `ERROR ${jqXHR.status} while retrieving assignment data from Canvas. Please refresh and try again.`);
    });
}

// ==========================
// Save Rubric Row (for a Single Criterion)
// ==========================
function saveCriterion(rowIndex, callback) {
    var courseId = window.location.href.split('/')[4];
    var urlParams = window.location.href.split('?')[1].split('&');
    var assignId, studentId;
    $.each(urlParams, function(i, param) {
        switch(param.split('=')[0]) {
            case "assignment_id":
                assignId = param.split('=')[1];
                break;
            case "student_id":
                studentId = param.split('=')[1];
                break;
        }
    });
    $.getJSON(`/api/v1/courses/${courseId}/assignments/${assignId}`, function(assignment) {
        $.getJSON(`/api/v1/courses/${courseId}/assignments/${assignId}/submissions/${studentId}?include[]=rubric_assessment`, function(submission) {
            var params = {};
            if ('rubric_assessment' in submission) {
                $.each(submission.rubric_assessment, function(rowKey, rowValue) {
                    $.each(rowValue, function(cellKey, cellValue) {
                        params[`rubric_assessment[${rowKey}][${cellKey}]`] = cellValue;
                    });
                });
            }
            var rowId = assignment.rubric[rowIndex].id;
            var tier;
            $($('tr[data-testid="rubric-criterion"]')[rowIndex]).find('.rating-tier').each(function(tierIndex) {
                if ($(this).hasClass("selected")) {
                    tier = tierIndex;
                }
            });
            if (tier === undefined) {
                params[`rubric_assessment[${rowId}][rating_id]`] = undefined;
            } else {
                params[`rubric_assessment[${rowId}][rating_id]`] = assignment.rubric[rowIndex].ratings[tier].id;
            }
            if (assignment.rubric_settings.hide_points) {
                params[`rubric_assessment[${rowId}][points]`] = assignment.rubric[rowIndex].ratings[tier].points;
            } else {
                const score = $($('td[data-testid="criterion-points"] input')[rowIndex]).val();
                if (isNaN(score)) {
                    params[`rubric_assessment[${rowId}][points]`] = undefined;
                    $($('td[data-testid="criterion-points"] input')[rowIndex]).val('');
                } else {
                    params[`rubric_assessment[${rowId}][points]`] = score;
                }
            }
            var comments = $($('#rubric_full tr[data-testid="rubric-criterion"]')[rowIndex]).find('textarea').val();
            if (comments === undefined) {
                comments = "";
            }
            params[`rubric_assessment[${rowId}][comments]`] = comments;
            $.ajax({
                url: `/api/v1/courses/${courseId}/assignments/${assignId}/submissions/${studentId}`,
                type: 'PUT',
                data: params,
                dataType: "text"
            }).fail(function (jqXHR, textStatus, errorThrown) {
                popUp("#srr_dialog", `ERROR ${jqXHR.status} while saving score. Please refresh and try again.`);
                callback(false);
            }).done(function () {
                callback(true);
            });
        });
    });
}

// ==========================
// Combined Initialization
// ==========================
defer(function() {
    'use strict';
    // Append dialog containers
    $("body").append($('<div id="import_rubric_popup_dialog" title="Import Rubric Scores"></div>'));
    $("body").append($('<div id="import_rubric_dialog" title="Import Rubric Scores"></div>'));
    $("body").append($('<div id="import_rubric_progress" title="Import Rubric Scores"><p>Importing rubric scores. Do not navigate away.</p><div id="import_rubric_bar"></div></div>'));
    $("body").append($('<div id="confirm_update_dialog" title="Confirm Update"></div>'));
    $("body").append($('<div id="export_rubric_dialog" title="Export Rubric Scores"></div>'));
    $("body").append($('<div id="srr_dialog" title="Save Rubric Row"></div>'));

    // Add Import and Export buttons if a rubric is visible.
    if ($('#rubric_summary_holder').length > 0) {
        $('#gradebook_header div.statsMetric')
            .append('<button type="button" class="Button" id="import_rubric_btn" style="margin-right:5px;">Import Rubric Scores</button>')
            .append('<button type="button" class="Button" id="export_rubric_btn">Export Rubric Scores</button>');

        $('#import_rubric_btn').click(function() {
            openImportDialog(function(importFile, successCallback) {
                Papa.parse(importFile, {
                    header: true,
                    dynamicTyping: false,
                    complete: function(results) {
                        validateData(results.data, successCallback);
                    }
                });
            }, importScores);
        });

        $('#export_rubric_btn').click(function() {
            exportRubricScores();
        });
    }

    // Initialize the Save Rubric Row functionality when in Speedgrader mode.
    waitForElement('#rubric_assessments_list_and_edit_button_holder > div > button', function() {
        $('#rubric_assessments_list_and_edit_button_holder > div > button').click(function() {
            if ($('#save_row_0').length === 0) {
                $('td[data-testid="criterion-points"]').each(function(index) {
                    var saveBtn = $(`<button type="button" class="Button Button--primary" id="save_row_${index}" style="margin-top:0.375em;">Save Row</button>`);
                    saveBtn.click(function() {
                        saveCriterion(index, function(success) {
                            if (success) {
                                $($('td[data-testid="criterion-points"]')[index]).append(`<span id="save_row_${index}_alert" style="display:block; margin-top:0.375em;" role="alert">Saved!</span>`);
                                setTimeout(function() {
                                    $(`#save_row_${index}_alert`).remove();
                                }, 1500);
                            }
                        });
                    });
                    $(this).append(saveBtn);
                });
            }
        });
    });
});
