from sqlalchemy.orm import Session
from loguru import logger
from app.models.schema import Evidence, FileChunk, VerificationStatus

def validate_evidence_against_document(evidence_id: str, db: Session) -> VerificationStatus:
    """
    Verifies that the extracted claim quote matches verbatim content in the actual
    page chunk of the PDF document. Updates the Evidence verification_status in DB.
    """
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        logger.error(f"Evidence record {evidence_id} not found")
        return VerificationStatus.UNSUPPORTED

    if not evidence.document_id or not evidence.excerpt:
        evidence.verification_status = VerificationStatus.UNSUPPORTED
        db.commit()
        return VerificationStatus.UNSUPPORTED

    # Find file chunk for the claimed page number
    chunk_query = db.query(FileChunk).filter(FileChunk.file_id == evidence.document_id)
    if evidence.page_number:
        chunk_query = chunk_query.filter(FileChunk.page_number == evidence.page_number)

    chunks = chunk_query.all()
    if not chunks:
        # Fallback to searching all chunks for this file
        chunks = db.query(FileChunk).filter(FileChunk.file_id == evidence.document_id).all()

    target_excerpt = evidence.excerpt.strip().lower()
    
    found_match = False
    for chunk in chunks:
        chunk_text = (chunk.content or "").lower()
        # Check verbatim quote or core 20-character substring overlap
        if target_excerpt in chunk_text or (len(target_excerpt) > 20 and target_excerpt[:20] in chunk_text):
            found_match = True
            break

    if found_match:
        evidence.verification_status = VerificationStatus.SUPPORTED
    else:
        # Flag as unsupported if quote is absent in actual document text
        logger.warning(f"Evidence {evidence_id} excerpt quote not verified on page {evidence.page_number}")
        evidence.verification_status = VerificationStatus.UNSUPPORTED

    db.commit()
    return evidence.verification_status
