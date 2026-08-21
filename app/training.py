"""
Training blueprint — FR02 (role-based training modules), FR03 (track/store
progress and completion), and the quiz engine (part of FR02/FR03).
NFR02 (privacy): every route here scopes data to the current user; an
employee can never read another employee's progress or quiz attempts.
"""
import json

from flask import Blueprint, render_template, redirect, url_for, flash, request, abort
from flask_login import login_required, current_user

from . import db
from .models import TrainingModule, Progress, Quiz, QuizAttempt

training_bp = Blueprint("training", __name__, url_prefix="/training")


@training_bp.route("/modules")
@login_required
def my_modules():
    modules = (
        TrainingModule.query.filter_by(target_role=current_user.role)
        .order_by(TrainingModule.order_index)
        .all()
    )
    progress_by_module = {
        p.module_id: p for p in Progress.query.filter_by(user_id=current_user.id).all()
    }
    return render_template("modules.html", modules=modules, progress=progress_by_module)


@training_bp.route("/modules/<module_id>")
@login_required
def view_module(module_id):
    module = TrainingModule.query.get_or_404(module_id)
    if module.target_role != current_user.role:
        abort(403)
    progress = Progress.query.filter_by(user_id=current_user.id, module_id=module.id).first()
    if progress is None:
        progress = Progress(user_id=current_user.id, module_id=module.id, status="in_progress")
        db.session.add(progress)
        db.session.commit()
    return render_template("module.html", module=module, progress=progress)


@training_bp.route("/modules/<module_id>/complete", methods=["POST"])
@login_required
def complete_module(module_id):
    module = TrainingModule.query.get_or_404(module_id)
    progress = Progress.query.filter_by(user_id=current_user.id, module_id=module.id).first()
    if progress is None:
        abort(404)
    from .models import now
    progress.status = "completed"
    progress.completed_at = now()
    db.session.commit()
    flash("Module marked as completed.", "success")
    if module.quiz:
        return redirect(url_for("training.take_quiz", quiz_id=module.quiz.id))
    return redirect(url_for("training.my_modules"))


@training_bp.route("/quiz/<quiz_id>", methods=["GET", "POST"])
@login_required
def take_quiz(quiz_id):
    quiz = Quiz.query.get_or_404(quiz_id)
    if quiz.module.target_role != current_user.role:
        abort(403)
    questions = json.loads(quiz.questions_json)

    if request.method == "POST":
        correct = 0
        for i, q in enumerate(questions):
            submitted = request.form.get(f"q{i}")
            if submitted is not None and int(submitted) == q["answer_index"]:
                correct += 1
        score = round(100 * correct / len(questions)) if questions else 0
        passed = score >= quiz.pass_threshold
        attempt = QuizAttempt(quiz_id=quiz.id, user_id=current_user.id, score=score, passed=passed)
        db.session.add(attempt)
        db.session.commit()
        return render_template("quiz_result.html", quiz=quiz, score=score, passed=passed)

    return render_template("quiz.html", quiz=quiz, questions=questions)


@training_bp.route("/quiz/<quiz_id>/history")
@login_required
def quiz_history(quiz_id):
    # NFR02: an employee may only view their own attempt history.
    attempts = (
        QuizAttempt.query.filter_by(quiz_id=quiz_id, user_id=current_user.id)
        .order_by(QuizAttempt.attempted_at.desc())
        .all()
    )
    return render_template("quiz_history.html", attempts=attempts)
